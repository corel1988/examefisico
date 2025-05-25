import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Contexto de Autenticação para compartilhar o estado do usuário
const AuthContext = createContext(null);

// Função auxiliar para formatar a data
const formatDate = (timestamp) => {
  if (!timestamp) return 'Nunca';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Variáveis globais (fornecidas pelo ambiente Canvas)
const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : null;
const canvasFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const canvasInitialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Configuração do Firebase para ambiente LOCAL (substitua com seus dados REAIS do console do Firebase)
const localFirebaseConfig = {
  apiKey: "AIzaSyC0ds__MgUNjL7k3mSAx--B_kKaXU40ato", // SUBSTITUA PELA SUA API KEY REAL
  authDomain: "medical-flashcards-app.firebaseapp.com", // SUBSTITUA PELO SEU AUTH DOMAIN REAL
  projectId: "medical-flashcards-app", // SUBSTITUA PELO SEU PROJECT ID REAL
  storageBucket: "medical-flashcards-app.firebase-storage.app", // SUBSTITUA PELO SEU STORAGE BUCKET REAL
  messagingSenderId: "243887661825", // SUBSTITUA PELO SEU MESSAGING SENDER ID REAL
  appId: "1:243887661825:web:53de03159c7b0c22b17100", // SUBSTITUA PELO SEU APP ID REAL
  // measurementId: "G-N3RBYE0536" // Opcional, se você não usa Analytics, pode remover
};

// Determine qual configuração usar: Canvas ou Local
const currentFirebaseConfig = canvasFirebaseConfig || localFirebaseConfig;
const currentAppId = canvasAppId || localFirebaseConfig.projectId; // Usa projectId como fallback para appId local
const currentInitialAuthToken = canvasInitialAuthToken; // Token inicial é apenas do Canvas

// Constantes para Áreas e Especialidades (compartilhadas entre componentes)
const AREAS_AND_SPECIALTIES = {
  'Cirurgia': ['Cirurgia do Trauma', 'Cirurgia Geral', 'Especialidades Cirúrgicas', 'Gastroenterologia'],
  'Clínica Médica': ['Cardiologia', 'Endocrinologia', 'Hematologia', 'Infectologia', 'Medicina Intensiva', 'Nefrologia', 'Neurologia', 'Pneumologia', 'Psiquiatria', 'Reumatologia'],
  'Pediatria': ['Cirurgia Pediátrica', 'Clínica Neonatal', 'Crescimento e Desenvolvimento na Infância', 'Endocrinologia', 'Geral', 'Hematologia', 'Nefrologia', 'Reumatologia', 'Síndromes Respiratórias na Infância'],
  'Ginecologia e Obstetrícia': ['Ginecologia e Obstetrícia'],
  'Preventiva': [
    'Análise de Métodos Diagnósticos', 'Bioestatística Aplicada à Análise de Estudos Epidemiológicos',
    'Causalidade em Epidemiologia', 'Conceitos Básicos e Definições',
    'Dinâmica de Transmissão e Distribuição Temporal das Doenças', 'Estudos Epidemiológicos',
    'Ética Médica', 'Humanização de Atendimento Médico', 'Indicadores', 'Infectologia',
    'Medicina Baseada em Evidências', 'Medicina do Trabalho', 'Medicina Legal',
    'Método Clínico Centrado na Pessoa', 'Política de Saúde no Brasil', 'Saúde do Idoso',
    'Semiologia', 'Sistema de Saúde Suplementar (ANS)', 'Transição Epidemiológica e Demográfica',
    'Vigilância Epidemiológica'
  ],
};


// Componente principal do aplicativo
function App() {
  // Estados relacionados à autenticação
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Estados relacionados ao Firestore e funcionalidades do app
  const [db, setDb] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentView, setCurrentView] = useState('list');
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('Todas');
  const [disciplines, setDisciplines] = useState([]); // Agora inclui 'Sem Disciplina' se aplicável
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]); // Estado para as questões do quiz
  const [quizName, setQuizName] = useState(''); // Novo estado para o nome do quiz

  // Email do usuário com permissão para cadastrar questões de residência
  const RESIDENCY_ADMIN_EMAIL = 'marcomca4@gmail.com';
  const canAddResidencyQuestion = user && user.email === RESIDENCY_ADMIN_EMAIL;

  // Inicializa Firebase e autentica o usuário
  useEffect(() => {
    const initializeFirebaseAndAuth = async () => {
      try {
        const app = initializeApp(currentFirebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setUserId(currentUser.uid);
            console.log('App - Usuário autenticado (onAuthStateChanged):', currentUser.uid);
          } else {
            setUser(null);
            setUserId(null);
            console.log('App - Usuário desautenticado (onAuthStateChanged).');
          }
          setLoadingAuth(false);
          setAuthChecked(true);
        });

        if (currentInitialAuthToken) {
          await signInWithCustomToken(firebaseAuth, currentInitialAuthToken);
          console.log('App - Autenticado com token personalizado do Canvas.');
        }

        return () => unsubscribe();
      } catch (err) {
        console.error('App - Erro ao inicializar Firebase ou autenticar:', err);
        setError('Erro ao carregar o aplicativo: ' + err.message);
        setLoadingAuth(false);
        setAuthChecked(true);
      }
    };

    initializeFirebaseAndAuth();
  }, []);

  // Função para fazer login com Google
  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError('Firebase Auth não está inicializado.');
      return;
    }
    setLoadingAuth(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log('App - Login com Google bem-sucedido.');
    } catch (err) {
      console.error('App - Erro ao fazer login com Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login com Google cancelado pelo usuário.');
      } else {
        setError('Erro ao fazer login com Google: ' + err.message);
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  // Função para fazer logout
  const handleSignOut = async () => {
    if (!auth) {
      setError('Firebase Auth não está inicializado.');
      return;
    }
    setLoadingAuth(true);
    setError(null);
    try {
      await signOut(auth);
      console.log('App - Usuário deslogado.');
    } catch (err) {
      console.error('App - Erro ao fazer logout:', err);
      setError('Erro ao fazer logout: ' + err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Listener para flashcards e disciplinas (agora combina dados do usuário e públicos)
  useEffect(() => {
    if (!db || !userId) {
      console.log('App - Firestore ou userId não disponíveis para buscar flashcards ou disciplinas. Aguardando autenticação.');
      return;
    }

    const userFlashcardsCollectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/flashcards`);
    const publicResidencyFlashcardsCollectionRef = collection(db, `artifacts/${currentAppId}/public/data/flashcards`);
    const disciplinesCollectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/disciplines`);

    let userCards = [];
    let publicResidencyCards = [];
    let currentDisciplinesFromCollection = new Set(); // Renamed to avoid conflict with inferredDisciplines

    const updateCombinedFlashcardsAndDisciplines = () => {
      const combinedFlashcards = [
        ...userCards,
        ...publicResidencyCards.filter(publicCard =>
          !userCards.some(userCard => userCard.id === publicCard.id) // Evita duplicatas se IDs se sobrepuserem
        )
      ];
      setFlashcards(combinedFlashcards);

      const inferredDisciplines = new Set();
      combinedFlashcards.forEach(card => {
        if (card.discipline) {
          inferredDisciplines.add(card.discipline);
        } else {
          inferredDisciplines.add('Sem Disciplina');
        }
      });

      // Mescla com as disciplinas da coleção explícita
      const mergedDisciplines = new Set([...currentDisciplinesFromCollection, ...Array.from(inferredDisciplines)]);
      setDisciplines(Array.from(mergedDisciplines).sort());
    };

    // Listener para flashcards privados do usuário
    const unsubscribeUserFlashcards = onSnapshot(userFlashcardsCollectionRef, (snapshot) => {
      userCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('App - Flashcards do usuário atualizados:', userCards.length);
      updateCombinedFlashcardsAndDisciplines();
    }, (err) => {
      console.error("App - Erro ao buscar flashcards do usuário:", err);
      setError("Erro ao carregar flashcards: " + err.message);
    });

    // Listener para flashcards de residência públicos
    const unsubscribePublicResidencyFlashcards = onSnapshot(query(publicResidencyFlashcardsCollectionRef, where('type', '==', 'residency')), (snapshot) => {
      publicResidencyCards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('App - Flashcards de residência públicos atualizados (PÚBLICO):', publicResidencyCards.length, publicResidencyCards.map(c => ({id: c.id, area: c.area, specialty: c.specialty, question: c.question.substring(0, 30) + '...'})));
      updateCombinedFlashcardsAndDisciplines();
    }, (err) => {
      console.error("App - Erro ao buscar flashcards de residência públicos:", err);
      setError("Erro ao carregar flashcards de residência: " + err.message);
    });

    // Listener para disciplinas (explicitamente gerenciadas)
    const unsubscribeDisciplines = onSnapshot(disciplinesCollectionRef, (snapshot) => {
      currentDisciplinesFromCollection = new Set(snapshot.docs.map(doc => doc.data().name));
      console.log('App - Disciplinas atualizadas (da coleção):', Array.from(currentDisciplinesFromCollection));
      updateCombinedFlashcardsAndDisciplines();
    }, (err) => {
      console.error("App - Erro ao buscar disciplinas:", err);
      setError("Erro ao carregar disciplinas: " + err.message);
    });

    return () => {
      unsubscribeUserFlashcards();
      unsubscribePublicResidencyFlashcards();
      unsubscribeDisciplines();
    };
  }, [db, userId, currentAppId]);


  // Funções CRUD para Flashcards (apenas para flashcards SIMPLES)
  const addFlashcard = async (newFlashcard) => {
    if (!db || !userId) {
      setMessage('Erro: Usuário não autenticado ou Firestore não disponível.');
      return;
    }
    try {
      const flashcardsCollectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/flashcards`);
      await addDoc(flashcardsCollectionRef, {
        ...newFlashcard,
        createdAt: serverTimestamp(),
        lastReviewedAt: null,
        nextReviewAt: null,
        reviewCount: 0,
        easeFactor: 2.5,
        interval: 0,
        reviewStats: { easy: 0, difficult: 0, forgotten: 0 },
        type: newFlashcard.type || 'simple', // Garante que o tipo seja 'simple' por padrão
      });
      if (newFlashcard.discipline && !disciplines.includes(newFlashcard.discipline)) {
        const disciplinesCollectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/disciplines`);
        await addDoc(disciplinesCollectionRef, { name: newFlashcard.discipline });
      }
      setMessage('Flashcard adicionado com sucesso!');
      setCurrentView('list');
    } catch (e) {
      console.error("App - Erro ao adicionar flashcard: ", e);
      setError("Erro ao adicionar flashcard: " + e.message);
    }
  };

  const updateFlashcard = async (id, updatedData) => {
    if (!db || !userId) {
      setMessage('Erro: Usuário não autenticado ou Firestore não disponível.');
      return;
    }
    try {
      // Verifica se é um flashcard de residência (que está na coleção pública)
      const isResidencyCard = flashcards.find(card => card.id === id && card.type === 'residency');
      let docRef;
      if (isResidencyCard) {
        docRef = doc(db, `artifacts/${currentAppId}/public/data/flashcards`, id);
      } else {
        docRef = doc(db, `artifacts/${currentAppId}/users/${userId}/flashcards`, id);
      }

      await updateDoc(docRef, updatedData);
      if (updatedData.discipline && !disciplines.includes(updatedData.discipline)) {
        const disciplinesCollectionRef = collection(db, `artifacts/${currentAppId}/users/${userId}/disciplines`);
        await addDoc(disciplinesCollectionRef, { name: updatedData.discipline });
      }
      setMessage('Flashcard atualizado com sucesso!');
      // Não altere a view aqui para permitir que a revisão continue
      // setCurrentView('list');
      // setEditingFlashcard(null);
    } catch (e) {
      console.error("App - Erro ao atualizar flashcard: ", e);
      setError("Erro ao atualizar flashcard: " + e.message);
    }
  };

  const deleteFlashcard = async (id) => {
    if (!db || !userId) {
      setMessage('Erro: Usuário não autenticado ou Firestore não disponível.');
      return;
    }
    try {
      // Verifica se é um flashcard de residência (que está na coleção pública)
      const isResidencyCard = flashcards.find(card => card.id === id && card.type === 'residency');
      let docRef;
      if (isResidencyCard) {
        docRef = doc(db, `artifacts/${currentAppId}/public/data/flashcards`, id);
      } else {
        docRef = doc(db, `artifacts/${currentAppId}/users/${userId}/flashcards`, id);
      }

      await deleteDoc(docRef);
      setMessage('Flashcard excluído com sucesso!');
      setShowDeleteConfirm(false);
      setFlashcardToDelete(null);
    } catch (e) {
      console.error("App - Erro ao excluir flashcard: ", e);
      setError("Erro ao excluir flashcard: " + e.message);
    }
  };

  // Funções de navegação
  const navigateTo = (view, flashcard = null, questions = [], quizNameParam = '') => { // Adicionado quizNameParam
    setCurrentView(view);
    setEditingFlashcard(flashcard);
    setQuizQuestions(questions); // Define as questões do quiz ao navegar para a visualização do quiz
    setQuizName(quizNameParam); // Define o nome do quiz
    setMessage('');
    setError(null);
    setShowMenu(false);
  };

  // Renderização do componente
  if (loadingAuth || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Carregando autenticação...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userId, auth, db, loadingAuth, handleGoogleSignIn, handleSignOut, currentAppId }}>
      {/* CSS global para rolagem e tela cheia */}
      <style>
        {`
        html,
        body,
        #root {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-y: auto; /* Permite a rolagem vertical */
        }

        /* O contêiner principal da aplicação React */
        .app-container {
            height: 100vh;      /* Ocupa toda a altura da viewport */
            width: 100vw;       /* Ocupa toda a largura da viewport */
            overflow-y: auto;   /* Ativa a rolagem vertical se o conteúdo for maior que a tela */
            display: flex;
            flex-direction: column;
            align-items: center; /* Centraliza o conteúdo horizontalmente */
        }

        /* Define um contêiner centralizado para o conteúdo interno da aplicação */
        .content-wrapper {
            max-width: 1280px;
            width: 100%; /* Garante que o wrapper ocupe a largura total disponível até o max-width */
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
        }

        /* Estilos para o logo (mantidos do seu CSS original) */
        .logo {
            height: 6em;
            padding: 1.5em;
            will-change: filter;
            transition: filter 300ms;
        }
        .logo:hover {
            filter: drop-shadow(0 0 2em #646cffaa);
        }
        .logo.react:hover {
            filter: drop-shadow(0 0 2em #61dafbaa);
        }

        /* Animação do logo (mantida do seu CSS original) */
        @keyframes logo-spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        @media (prefers-reduced-motion: no-preference) {
            a:nth-of-type(2) .logo {
                animation: logo-spin infinite 20s linear;
            }
        }

        /* Outras classes (mantidas do seu CSS original) */
        .card {
            padding: 2em;
        }

        .read-the-docs {
            color: #888;
        }
        `}
      </style>
      <div className={`app-container ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-white'} font-sans antialiased transition-colors duration-300`}>
        <div className={`content-wrapper p-8 rounded-xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-indigo-200">
            <h1 className={`text-4xl font-extrabold ${darkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>
              Flashcards Médicos
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMenu(true)}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700'} hover:scale-110 transition-transform`}
                aria-label="Open menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'} hover:scale-110 transition-transform`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.325 5.325l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Olá, <span className="font-semibold">{user.displayName || user.email || 'Usuário Anônimo'}</span>
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44.5 24.008c0-1.656-.145-3.26-.413-4.82h-20.08v9.125h11.44c-.512 2.744-2.106 5.06-4.54 6.628v7.452h9.58c5.61-5.18 8.8-12.872 8.8-21.385z" fill="#4285F4"/>
                    <path d="M24.417 44.008c6.19 0 11.37-2.05 15.16-5.568l-9.58-7.452c-2.65 1.77-6.075 2.808-9.58 2.808-7.38 0-13.63-4.99-15.86-11.72H3.05v7.625c3.94 7.77 11.95 13.06 21.367 13.06z" fill="#34A853"/>
                    <path d="M8.557 26.837c-.504-1.77-.79-3.65-.79-5.597 0-1.947.286-3.827.79-5.597V7.99h-4.91c-1.39 2.76-2.18 5.86-2.18 9.17 0 3.31 1.01 6.41 2.18 9.17l4.91 7.625v-7.625z" fill="#FBBC05"/>
                    <path d="M24.417 7.99c3.27 0 6.22 1.12 8.52 3.3l8.03-8.03c-4.7-4.38-10.95-6.76-16.55-6.76-11.417 0-19.427 5.29-21.367 13.06l4.91 7.625c2.23-6.73 8.48-11.72 15.86-11.72z" fill="#EA4335"/>
                  </svg>
                  <span>Entrar com Google</span>
                </button>
              )}
            </div>
          </header>

          {/* Menu Overlay */}
          {showMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start">
              <div className={`w-64 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-white'} shadow-lg p-6`}>
                <button
                  onClick={() => setShowMenu(false)}
                  className={`absolute top-4 left-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-200 text-gray-700'} hover:scale-110 transition-transform`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <nav className="mt-8 space-y-4">
                  <button
                    onClick={() => navigateTo('list')}
                    className={`block w-full text-left py-2 px-4 rounded-lg ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Meus Flashcards
                  </button>
                  <button
                    onClick={() => navigateTo('statistics')}
                    className={`block w-full text-left py-2 px-4 rounded-lg ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    Estatísticas
                  </button>
                  {canAddResidencyQuestion && (
                    <button
                      onClick={() => navigateTo('add-residency-question')}
                      className={`block w-full text-left py-2 px-4 rounded-lg ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Cadastro de Questões de Residência
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('residency-quiz-setup')}
                    className={`block w-full text-left py-2 px-4 rounded-lg ${darkMode ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                    Resolver Questões de Residência
                  </button>
                </nav>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}

          {userId && (
            <div className="text-sm text-gray-500 mb-6 text-center">
              Seu ID de Usuário (UID): <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{userId}</span>
            </div>
          )}

          {currentView === 'list' && userId && (
            <FlashcardList
              flashcards={flashcards}
              disciplines={disciplines}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterDiscipline={filterDiscipline}
              setFilterDiscipline={setFilterDiscipline}
              onEdit={navigateTo}
              onDelete={(flashcard) => { setFlashcardToDelete(flashcard); setShowDeleteConfirm(true); }}
              onAdd={() => navigateTo('add')}
              onReview={() => navigateTo('review')}
              onQuiz={() => navigateTo('quiz')}
              onImportExport={() => navigateTo('import-export')}
              onShare={() => navigateTo('share')}
              darkMode={darkMode}
            />
          )}
          {currentView === 'add' && userId && (
            <FlashcardForm
              onSave={addFlashcard}
              onCancel={() => navigateTo('list')}
              disciplines={disciplines}
              darkMode={darkMode}
            />
          )}
          {currentView === 'edit' && userId && editingFlashcard && (
            <FlashcardForm
              flashcard={editingFlashcard}
              onSave={updateFlashcard}
              onCancel={() => navigateTo('list')}
              disciplines={disciplines}
              darkMode={darkMode}
            />
          )}
          {currentView === 'add-residency-question' && userId && (
            <ResidencyQuestionForm
              onCancel={() => navigateTo('list')}
              disciplines={disciplines}
              darkMode={darkMode}
              canAddResidencyQuestion={canAddResidencyQuestion}
              db={db} // Pass db
              appId={currentAppId} // Pass appId
              userId={userId} // Pass userId
            />
          )}
          {currentView === 'review' && userId && (
            <FlashcardReview
              allFlashcards={flashcards}
              disciplines={disciplines}
              onUpdateReview={updateFlashcard}
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
            />
          )}
          {currentView === 'quiz' && userId && (
            <FlashcardQuiz
              flashcards={flashcards.filter(card => card.type === 'residency')} // Only residency questions for quiz
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
            />
          )}
          {currentView === 'residency-quiz-setup' && userId && (
            <ResidencyQuizSetup
              allFlashcards={flashcards.filter(card => card.type === 'residency')}
              onStartQuiz={(questions, quizName) => navigateTo('residency-quiz', null, questions, quizName)} // Pass quizName
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
              db={db} // Pass db
              appId={currentAppId} // Pass appId
              setError={setError} // Pass setError
            />
          )}
          {currentView === 'residency-quiz' && userId && quizQuestions.length > 0 && (
            <ResidencyQuiz
              quizQuestions={quizQuestions}
              quizName={quizName} // Pass quizName
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
            />
          )}
          {currentView === 'import-export' && userId && (
            <ImportExport
              flashcards={flashcards}
              onImport={addFlashcard}
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
            />
          )}
          {currentView === 'share' && userId && (
            <ShareFlashcards
              userId={userId}
              db={db}
              appId={currentAppId}
              onBack={() => navigateTo('list')}
              setMessage={setMessage}
              setError={setError}
              darkMode={darkMode}
            />
          )}
          {currentView === 'statistics' && userId && (
            <Statistics
              flashcards={flashcards}
              disciplines={disciplines}
              onBack={() => navigateTo('list')}
              darkMode={darkMode}
            />
          )}

          {!userId && !loadingAuth && authChecked && (
            <div className="text-center py-8 w-full flex flex-col items-center justify-center">
              <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Para acessar suas funcionalidades, faça login com sua conta Google.
              </p>
              <button
                onClick={handleGoogleSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 mx-auto"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44.5 24.008c0-1.656-.145-3.26-.413-4.82h-20.08v9.125h11.44c-.512 2.744-2.106 5.06-4.54 6.628v7.452h9.58c5.61-5.18 8.8-12.872 8.8-21.385z" fill="#4285F4"/>
                  <path d="M24.417 44.008c6.19 0 11.37-2.05 15.16-5.568l-9.58-7.452c-2.65 1.77-6.075 2.808-9.58 2.808-7.38 0-13.63-4.99-15.86-11.72H3.05v7.625c3.94 7.77 11.95 13.06 21.367 13.06z" fill="#34A853"/>
                  <path d="M8.557 26.837c-.504-1.77-.79-3.65-.79-5.597 0-1.947.286-3.827.79-5.597V7.99h-4.91c-1.39 2.76-2.18 5.86-2.18 9.17 0 3.31 1.01 6.41 2.18 9.17l4.91 7.625v-7.625z" fill="#FBBC05"/>
                  <path d="M24.417 7.99c3.27 0 6.22 1.12 8.52 3.3l8.03-8.03c-4.7-4.38-10.95-6.76-16.55-6.76-11.417 0-19.427 5.29-21.367 13.06l4.91 7.625c2.23-6.73 8.48-11.72 15.86-11.72z" fill="#EA4335"/>
                </svg>
                <span>Entrar com Google</span>
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <DeleteConfirmModal
              flashcard={flashcardToDelete}
              onConfirm={() => deleteFlashcard(flashcardToDelete.id)}
              onCancel={() => setShowDeleteConfirm(false)}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </AuthContext.Provider>
  );
}

// --- Componentes Auxiliares (Mantenha-os em arquivos separados em um projeto real) ---

// Novo componente para exibir o título da disciplina
const DisciplineTitle = React.memo(({ disciplineName, darkMode, onBackToAll, searchTerm }) => {
  console.log('DisciplineTitle received disciplineName:', disciplineName); // Debug log
  const displayMessage = `Flashcards em "${disciplineName}"`;
  const searchInfo = searchTerm.trim() !== '' ? ` (buscando por "${searchTerm}")` : '';

  return (
    <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
      {displayMessage}{searchInfo}
      <button
        onClick={onBackToAll}
        className="ml-4 text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded-lg transition duration-200"
      >
        Voltar para Disciplinas
      </button>
    </h3>
  );
},
(prevProps, nextProps) =>
  prevProps.disciplineName === nextProps.disciplineName &&
  prevProps.searchTerm === nextProps.searchTerm &&
  prevProps.darkMode === nextProps.darkMode &&
  prevProps.onBackToAll === nextProps.onBackToAll
);


// Componente para a lista de Flashcards
function FlashcardList({ flashcards, disciplines, searchTerm, setSearchTerm, filterDiscipline, setFilterDiscipline, onEdit, onDelete, onAdd, onReview, onQuiz, onImportExport, onShare, darkMode }) {
  const [selectedDisciplineForDisplay, setSelectedDisciplineForDisplay] = useState('Todas');

  // Memoize the callback function for onBackToAll
  const handleBackToAllDisciplines = useCallback(() => {
    setSelectedDisciplineForDisplay('Todas');
    setSearchTerm(''); // Clear search term when going back to all disciplines
  }, []);

  const filteredFlashcards = useMemo(() => {
    let currentCards = flashcards;

    if (selectedDisciplineForDisplay !== 'Todas') {
      currentCards = currentCards.filter(card => {
        const cardDiscipline = card.discipline || 'Sem Disciplina'; // Normalize discipline
        return cardDiscipline === selectedDisciplineForDisplay;
      });
    }

    if (searchTerm.trim() !== '') {
      currentCards = currentCards.filter(card => {
        const questionMatch = card.question.toLowerCase().includes(searchTerm.toLowerCase());
        const answerMatch = card.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const disciplineMatch = (card.discipline || 'Sem Disciplina').toLowerCase().includes(searchTerm.toLowerCase());
        return questionMatch || answerMatch || disciplineMatch;
      });
    }

    return currentCards;
  }, [flashcards, searchTerm, selectedDisciplineForDisplay]);

  const disciplineCounts = useMemo(() => {
    const counts = {};
    flashcards.forEach(card => {
      const disc = card.discipline || 'Sem Disciplina';
      counts[disc] = (counts[disc] || 0) + 1;
    });
    return counts;
  }, [flashcards]);

  const disciplinesWithCounts = useMemo(() => {
    const uniqueDisciplines = [...new Set(flashcards.map(card => card.discipline || 'Sem Disciplina'))];
    return uniqueDisciplines.map(disc => ({
      name: disc,
      count: disciplineCounts[disc] || 0
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [flashcards, disciplineCounts]);

  return (
    <div className={`w-full rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <h2 className={`text-3xl font-bold mb-6 px-4 pt-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Meus Flashcards</h2>

      <div className="flex flex-wrap gap-4 mb-6 px-4">
        <input
          type="text"
          placeholder="Buscar flashcards..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedDisciplineForDisplay('Todas');
          }}
          className={`flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400' : 'border-gray-300 text-white placeholder-gray-500'}`}
        />
        <select
          value={selectedDisciplineForDisplay}
          onChange={(e) => {
            console.log('Selected discipline in dropdown:', e.target.value); // Debug log
            setSelectedDisciplineForDisplay(e.target.value);
            setSearchTerm('');
          }}
          className={`p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
        >
          <option value="Todas">Todas as Disciplinas</option>
          {disciplines.map(disc => (
            <option key={disc} value={disc}>{disc}</option>
          ))}
        </select>
        <button onClick={onAdd} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Adicionar Novo
        </button>
      </div>

      {selectedDisciplineForDisplay !== 'Todas' ? (
        <DisciplineTitle
          key={selectedDisciplineForDisplay} // Added key prop
          disciplineName={selectedDisciplineForDisplay}
          searchTerm={searchTerm}
          darkMode={darkMode}
          onBackToAll={handleBackToAllDisciplines} // Use the memoized callback
        />
      ) : (
        searchTerm.trim() !== '' && (
          <h3 className={`text-2xl font-bold mb-4 px-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
            Resultados da busca para "{searchTerm}"
          </h3>
        )
      )}

      {searchTerm.trim() !== '' || selectedDisciplineForDisplay !== 'Todas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-4">
          {filteredFlashcards.length === 0 ? (
            <p className={`col-span-full text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhum flashcard encontrado.
            </p>
          ) : (
            filteredFlashcards.map(card => (
              <div key={card.id} className={`relative p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'} transition-all duration-200 hover:shadow-xl`}>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{card.question}</h3>
                {card.type === 'residency' && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alternativas:</p>
                    <ul className="list-disc list-inside text-left">
                      {card.alternatives.map((alt, index) => (
                        <li key={index} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${card.correctAnswerIndex === index ? 'font-bold text-green-600' : ''}`}>
                          {String.fromCharCode(65 + index)}. {alt.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {card.type !== 'residency' && (
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{card.answer}</p>
                )}
                {card.type === 'residency' && card.comment && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                    <span className="font-medium">Comentário:</span> {card.comment}
                  </p>
                )}
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Disciplina:</span> {card.discipline || 'N/A'}
                </p>
                {card.type === 'residency' && (
                  <>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="font-medium">Área:</span> {card.area || 'N/A'}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span className="font-medium">Especialidade:</span> {card.specialty || 'N/A'}
                    </p>
                  </>
                )}
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Criado em:</span> {formatDate(card.createdAt)}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Última Revisão:</span> {formatDate(card.lastReviewedAt)}
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => onEdit('edit', card)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(card)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pb-4">
          {disciplinesWithCounts.length === 0 ? (
            <p className={`col-span-full text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Nenhuma disciplina cadastrada. Adicione um flashcard para criar uma!
            </p>
          ) : (
            disciplinesWithCounts.map(disc => (
              <div
                key={disc.name}
                onClick={() => setSelectedDisciplineForDisplay(disc.name)}
                className={`relative p-6 rounded-xl shadow-lg cursor-pointer ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'} transition-all duration-200 hover:shadow-xl hover:scale-105`}
              >
                <h3 className={`text-xl font-semibold mb-1 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                  {disc.name}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {disc.count} flashcard{disc.count !== 1 ? 's' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-4 px-4 pb-4">
        <button onClick={onReview} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Revisar Flashcards
        </button>
        <button onClick={onQuiz} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Fazer Quiz
        </button>
        <button onClick={onImportExport} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Importar/Exportar
        </button>
        <button onClick={onShare} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Compartilhar
        </button>
      </div>
    </div>
  );
}

// Componente para o formulário de Adicionar/Editar Flashcard SIMPLES
function FlashcardForm({ flashcard, onSave, onCancel, disciplines, darkMode }) {
  const [question, setQuestion] = useState(flashcard ? flashcard.question : '');
  const [answer, setAnswer] = useState(flashcard ? flashcard.answer : '');
  const [discipline, setDiscipline] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [showNewDisciplineInput, setShowNewDisciplineInput] = useState(false);

  useEffect(() => {
    if (flashcard) {
      if (!disciplines.includes(flashcard.discipline)) {
        setShowNewDisciplineInput(true);
        setNewDiscipline(flashcard.discipline || '');
        setDiscipline('new-discipline');
      } else {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline(flashcard.discipline);
      }
    } else {
      if (disciplines.length > 0 && !disciplines.includes('Sem Disciplina')) {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline(disciplines[0]);
      } else if (disciplines.includes('Sem Disciplina')) {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline('Sem Disciplina');
      } else {
        setShowNewDisciplineInput(true);
        setNewDiscipline('');
        setDiscipline('new-discipline');
      }
    }
  }, [flashcard, disciplines]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalDiscipline = showNewDisciplineInput && newDiscipline.trim() !== '' ? newDiscipline.trim() : discipline;
    if (flashcard) {
      onSave(flashcard.id, { question, answer, discipline: finalDiscipline === 'Sem Disciplina' ? null : finalDiscipline, type: 'simple' });
    } else {
      onSave({ question, answer, discipline: finalDiscipline === 'Sem Disciplina' ? null : finalDiscipline, type: 'simple' });
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
        {flashcard ? 'Editar Flashcard Simples' : 'Adicionar Novo Flashcard Simples'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Pergunta</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows="3"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
            placeholder="Digite aqui a pergunta do flashcard..."
          ></textarea>
        </div>
        <div>
          <label htmlFor="answer" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Resposta</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            rows="3"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
            placeholder="Digite aqui a resposta do flashcard..."
          ></textarea>
        </div>
        <div>
          <label htmlFor="discipline" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Disciplina (geral)</label>
          <select
            id="discipline"
            value={discipline}
            onChange={(e) => {
              setDiscipline(e.target.value);
              setShowNewDisciplineInput(e.target.value === 'new-discipline');
              if (e.target.value !== 'new-discipline') {
                setNewDiscipline('');
              }
            }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
          >
            {disciplines.map(disc => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
            <option value="new-discipline">Criar Nova Disciplina</option>
          </select>
          {showNewDisciplineInput && (
            <input
              type="text"
              placeholder="Nome da nova disciplina"
              value={newDiscipline}
              onChange={(e) => setNewDiscipline(e.target.value)}
              className={`mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
              required={showNewDisciplineInput}
            />
          )}
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Salvar Flashcard
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Preview Section for Simple Flashcard */}
      <div className={`mt-8 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Pré-visualização do Flashcard Simples</h3>
        <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{question || 'Sua pergunta aparecerá aqui...'}</p>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{answer || 'Sua resposta aparecerá aqui...'}</p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="font-medium">Disciplina:</span> {discipline || 'N/A'}
        </p>
      </div>
    </div>
  );
}


// Novo Componente para o Cadastro de Questões de Residência Médica
function ResidencyQuestionForm({ flashcard, onCancel, disciplines, darkMode, canAddResidencyQuestion, db, appId, userId }) {
  const [question, setQuestion] = useState(flashcard ? flashcard.question : '');
  const [alternatives, setAlternatives] = useState(flashcard && flashcard.type === 'residency' && flashcard.alternatives ? flashcard.alternatives : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(flashcard && flashcard.type === 'residency' ? flashcard.correctAnswerIndex : -1);
  const [commentText, setCommentText] = useState(flashcard && flashcard.type === 'residency' ? flashcard.comment : '');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [selectedArea, setSelectedArea] = useState(flashcard && flashcard.type === 'residency' ? flashcard.area : '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(flashcard && flashcard.type === 'residency' ? flashcard.specialty : '');
  const [discipline, setDiscipline] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [showNewDisciplineInput, setShowNewDisciplineInput] = useState(false);

  const availableAreas = Object.keys(AREAS_AND_SPECIALTIES).sort();
  const availableSpecialties = selectedArea ? AREAS_AND_SPECIALTIES[selectedArea].sort() : [];

  useEffect(() => {
    if (flashcard) {
      if (!disciplines.includes(flashcard.discipline)) {
        setShowNewDisciplineInput(true);
        setNewDiscipline(flashcard.discipline || '');
        setDiscipline('new-discipline');
      } else {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline(flashcard.discipline);
      }
    } else {
      if (disciplines.length > 0 && !disciplines.includes('Sem Disciplina')) {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline(disciplines[0]);
      } else if (disciplines.includes('Sem Disciplina')) {
        setShowNewDisciplineInput(false);
        setNewDiscipline('');
        setDiscipline('Sem Disciplina');
      } else {
        setShowNewDisciplineInput(true);
        setNewDiscipline('');
        setDiscipline('new-discipline');
      }
    }
  }, [flashcard, disciplines]);

  // Handle changes for alternatives
  const handleAlternativeChange = (index, value) => {
    const newAlternatives = [...alternatives];
    newAlternatives[index].text = value;
    setAlternatives(newAlternatives);
  };

  // Handle correct answer selection
  const handleCorrectAnswerChange = (index) => {
    setCorrectAnswerIndex(index);
  };

  // Add new alternative
  const handleAddAlternative = () => {
    setAlternatives([...alternatives, { text: '', isCorrect: false }]);
  };

  // Remove alternative
  const handleRemoveAlternative = (index) => {
    const newAlternatives = alternatives.filter((_, i) => i !== index);
    if (correctAnswerIndex === index) {
      setCorrectAnswerIndex(-1); // Reset correct answer if removed
    } else if (correctAnswerIndex > index) {
      setCorrectAnswerIndex(correctAnswerIndex - 1); // Adjust index if correct answer was after removed one
    }
    setAlternatives(newAlternatives);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalDiscipline = showNewDisciplineInput && newDiscipline.trim() !== '' ? newDiscipline.trim() : discipline;

    // Validation for residency questions
    const filledAlternatives = alternatives.filter(alt => alt.text.trim() !== '');
    if (filledAlternatives.length < 2) {
      console.error("ResidencyQuestionForm - Por favor, adicione pelo menos duas alternativas preenchidas.");
      return;
    }
    if (correctAnswerIndex === -1 || correctAnswerIndex >= alternatives.length || alternatives[correctAnswerIndex].text.trim() === '') {
      console.error("ResidencyQuestionForm - Por favor, selecione uma alternativa correta válida.");
      return;
    }
    if (!selectedArea || !selectedSpecialty) {
      console.error("ResidencyQuestionForm - Por favor, selecione a Área e a Especialidade.");
      return;
    }

    const questionData = {
      type: 'residency',
      question,
      alternatives: alternatives.map((alt, index) => ({
        text: alt.text,
        isCorrect: index === correctAnswerIndex // Ensure isCorrect is set based on selected index
      })).filter(alt => alt.text.trim() !== ''), // Filter out empty alternatives
      correctAnswerIndex: correctAnswerIndex, // Save the index
      comment: commentText,
      area: selectedArea,
      specialty: selectedSpecialty,
      discipline: finalDiscipline === 'Sem Disciplina' ? null : finalDiscipline,
      ownerId: userId, // Store the ID of the user who created it
    };

    try {
      const publicFlashcardsRef = collection(db, `artifacts/${appId}/public/data/flashcards`);

      if (flashcard) {
        // If editing, update the existing public flashcard
        const docRef = doc(db, `artifacts/${appId}/public/data/flashcards`, flashcard.id);
        await updateDoc(docRef, questionData);
        console.log("ResidencyQuestionForm - Questão de residência atualizada na coleção pública:", flashcard.id);
      } else {
        // If adding, add to the public collection
        await addDoc(publicFlashcardsRef, { ...questionData, createdAt: serverTimestamp() }); // Add createdAt for new docs
        console.log("ResidencyQuestionForm - Nova questão de residência adicionada à coleção pública.");
      }
      onCancel(); // Go back to the list after saving
    } catch (e) {
      console.error("ResidencyQuestionForm - Erro ao salvar questão de residência na coleção pública: ", e);
      // Aqui você pode adicionar uma lógica para exibir uma mensagem de erro para o usuário
    }
  };

  if (!canAddResidencyQuestion && !flashcard) { // If not admin and not editing an existing card
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
        <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
          Cadastro de Questões de Residência
        </h2>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg mb-4`}>
          Apenas usuários autorizados podem cadastrar novas questões de residência.
        </p>
        <button onClick={onCancel} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
        {flashcard ? 'Editar Questão de Residência' : 'Adicionar Nova Questão de Residência'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Pergunta</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            rows="3"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
            placeholder="Digite aqui a questão..."
            readOnly={!canAddResidencyQuestion && !flashcard} // Read-only if not admin and not editing
          ></textarea>
        </div>

        <div className="space-y-3">
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Alternativas:</label>
          {alternatives.map((alt, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                name="correctAlternative"
                checked={correctAnswerIndex === index}
                onChange={() => handleCorrectAnswerChange(index)}
                className="form-radio text-green-600"
                disabled={!canAddResidencyQuestion && !flashcard} // Disable if not admin and not editing
              />
              <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{String.fromCharCode(65 + index)}:</span>
              <input
                type="text"
                value={alt.text}
                onChange={(e) => handleAlternativeChange(index, e.target.value)}
                className={`flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
                placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                readOnly={!canAddResidencyQuestion && !flashcard} // Read-only if not admin and not editing
              />
              {canAddResidencyQuestion && alternatives.length > 2 && ( // Only admin can remove alternatives, and only if more than 2 alternatives
                <button
                  type="button"
                  onClick={() => handleRemoveAlternative(index)}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full"
                  aria-label="Remover alternativa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" stroke="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {canAddResidencyQuestion && ( // Only admin can add alternatives
            <button
              type="button"
              onClick={handleAddAlternative}
              className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300 ease-in-out transform hover:scale-105 shadow-md flex items-center justify-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Adicionar Nova Alternativa</span>
            </button>
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowCommentInput(!showCommentInput)}
            className={`flex items-center space-x-2 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} hover:text-indigo-600 transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>{showCommentInput ? 'Ocultar Comentário' : 'Adicionar/Visualizar Comentário'}</span>
          </button>
          {showCommentInput && (
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows="4"
              className={`mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
              placeholder="Adicione um comentário explicativo para a questão..."
              readOnly={!canAddResidencyQuestion && !flashcard} // Read-only if not admin and not editing
            ></textarea>
          )}
        </div>

        <div className="mt-6">
          <label htmlFor="area" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Área</label>
          <select
            id="area"
            value={selectedArea}
            onChange={(e) => { setSelectedArea(e.target.value); setSelectedSpecialty(''); }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
            required
            disabled={!canAddResidencyQuestion && !flashcard} // Disable if not admin and not editing
          >
            <option value="">Selecione uma Área</option>
            {availableAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label htmlFor="specialty" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Especialidade</label>
          <select
            id="specialty"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
            disabled={!selectedArea || (!canAddResidencyQuestion && !flashcard)} // Disable if no area selected or not admin/editing
            required
          >
            <option value="">Selecione uma Especialidade</option>
            {availableSpecialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="discipline" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Disciplina (geral)</label>
          <select
            id="discipline"
            value={discipline}
            onChange={(e) => {
              setDiscipline(e.target.value);
              setShowNewDisciplineInput(e.target.value === 'new-discipline');
              if (e.target.value !== 'new-discipline') {
                setNewDiscipline('');
              }
            }}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
            disabled={!canAddResidencyQuestion && !flashcard} // Disable if not admin and not editing
          >
            {disciplines.map(disc => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
            {canAddResidencyQuestion && <option value="new-discipline">Criar Nova Disciplina</option>}
          </select>
          {showNewDisciplineInput && canAddResidencyQuestion && ( // Only admin can create new discipline
            <input
              type="text"
              placeholder="Nome da nova disciplina"
              value={newDiscipline}
              onChange={(e) => setNewDiscipline(e.target.value)}
              className={`mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-gray-500 ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}
              required={showNewDisciplineInput}
            />
          )}
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
            disabled={!canAddResidencyQuestion && !flashcard} // Disable if not admin and not editing
          >
            Salvar Questão
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Preview Section for Residency Question */}
      <div className={`mt-8 p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Pré-visualização da Questão de Residência</h3>
        <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{question || 'Sua pergunta aparecerá aqui...'}</p>

        <div className="mb-4">
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alternativas:</p>
          <ul className="list-disc list-inside text-left">
            {alternatives.filter(alt => alt.text.trim() !== '').map((alt, index) => (
              <li key={index} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${correctAnswerIndex === index ? 'font-bold text-green-600' : ''}`}>
                {String.fromCharCode(65 + index)}. {alt.text}
              </li>
            ))}
          </ul>
        </div>

        {commentText && (
          <div className="mt-2">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-medium">Comentário:</span> {commentText}
            </p>
          </div>
        )}
        {selectedArea && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="font-medium">Área:</span> {selectedArea}
          </p>
        )}
        {selectedSpecialty && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="font-medium">Especialidade:</span> {selectedSpecialty}
          </p>
        )}
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="font-medium">Disciplina:</span> {discipline || 'N/A'}
        </p>
      </div>
    </div>
  );
}


// Componente para Confirmação de Exclusão
function DeleteConfirmModal({ flashcard, onConfirm, onCancel, darkMode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`p-8 rounded-xl shadow-2xl w-full max-w-md text-center ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-white'}`}>
        <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Confirmar Exclusão</h3>
        <p className="mb-6">Tem certeza que deseja excluir o flashcard: <span className="font-semibold">"{flashcard.question}"</span>?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Sim, Excluir
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para Revisão de Flashcards
function FlashcardReview({ allFlashcards, onUpdateReview, onBack, disciplines, darkMode }) {
  const [selectedReviewDiscipline, setSelectedReviewDiscipline] = useState('Todas');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Filtra os flashcards com base na disciplina selecionada
  const filteredReviewCards = useMemo(() => {
    if (selectedReviewDiscipline === 'Todas') {
      return allFlashcards;
    }
    return allFlashcards.filter(card => {
      // Normaliza a disciplina do card para 'Sem Disciplina' se for null/undefined
      const cardDiscipline = card.discipline || 'Sem Disciplina';
      return cardDiscipline === selectedReviewDiscipline;
    });
  }, [allFlashcards, selectedReviewDiscipline]);

  // Redefine o índice e o estado da resposta APENAS quando a disciplina de revisão muda
  useEffect(() => {
    setCurrentCardIndex(0);
    setShowAnswer(false);
  }, [selectedReviewDiscipline]); // Removido filteredReviewCards das dependências

  const currentCard = filteredReviewCards[currentCardIndex];

  const handleNextCard = async (quality) => {
    if (!currentCard) return;

    const updatedReviewStats = { ...currentCard.reviewStats };
    if (!updatedReviewStats.easy) updatedReviewStats.easy = 0;
    if (!updatedReviewStats.difficult) updatedReviewStats.difficult = 0;
    if (!updatedReviewStats.forgotten) updatedReviewStats.forgotten = 0;

    if (quality === 5) {
      updatedReviewStats.easy += 1;
    } else if (quality === 3) {
      updatedReviewStats.difficult += 1;
    } else if (quality === 0) {
      updatedReviewStats.forgotten += 1;
    }

    await onUpdateReview(currentCard.id, {
      reviewStats: updatedReviewStats,
      lastReviewedAt: serverTimestamp(),
    });

    setShowAnswer(false);
    if (currentCardIndex < filteredReviewCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      onBack();
    }
  };

  if (filteredReviewCards.length === 0) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg mb-4`}>
          Nenhum flashcard para revisar
          {selectedReviewDiscipline !== 'Todas' ? ` na disciplina "${selectedReviewDiscipline}"` : ''} no momento.
        </p>
        <button onClick={onBack} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Voltar para a Lista
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Revisar Flashcards</h2>

      <div className="mb-4">
        <label htmlFor="reviewDiscipline" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Filtrar por Disciplina:
        </label>
        <select
          id="reviewDiscipline"
          value={selectedReviewDiscipline}
          onChange={(e) => setSelectedReviewDiscipline(e.target.value)}
          className={`p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
        >
          <option value="Todas">Todas as Disciplinas</option>
          {disciplines.map(disc => (
            <option key={disc} value={disc}>{disc}</option>
          ))}
        </select>
      </div>

      {currentCard ? (
        <div className={`p-8 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'} min-h-[200px] flex flex-col justify-between`}>
          <p className={`text-xl font-semibold mb-4 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{currentCard.question}</p>
          {currentCard.type === 'residency' && (
            <div className="mb-4 text-left">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alternativas:</p>
              <ul className="list-disc list-inside">
                {currentCard.alternatives.map((alt, index) => (
                  <li key={index} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${showAnswer && currentCard.correctAnswerIndex === index ? 'font-bold text-green-600' : ''}`}>
                    {String.fromCharCode(65 + index)}. {alt.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showAnswer && currentCard.type !== 'residency' && (
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg mt-4`}>{currentCard.answer}</p>
          )}
          {showAnswer && currentCard.type === 'residency' && currentCard.comment && (
            <div className="mt-4 text-left">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="font-medium">Comentário:</span> {currentCard.comment}
              </p>
            </div>
          )}
          <div className="mt-6">
            {!showAnswer ? (
              <button
                onClick={() => setShowAnswer(true)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
              >
                Mostrar Resposta
              </button>
            ) : (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleNextCard(0)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Esqueci
                </button>
                <button
                  onClick={() => handleNextCard(3)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Lembrei (Difícil)
                </button>
                <button
                  onClick={() => handleNextCard(5)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                  Lembrei (Fácil)
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carregando flashcard...</p>
      )}
      <button onClick={onBack} className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
        Voltar
      </button>
    </div>
  );
}

// Componente para Configuração do Quiz de Residência
function ResidencyQuizSetup({ allFlashcards, onStartQuiz, onBack, darkMode, db, appId, setError }) {
  const [selectedArea, setSelectedArea] = useState('Todas');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState(''); // Novo estado para o título do quiz

  const availableAreas = ['Todas', ...Object.keys(AREAS_AND_SPECIALTIES).sort()];
  const availableSpecialties = selectedArea === 'Todas'
    ? ['Todas', ...new Set(Object.values(AREAS_AND_SPECIALTIES).flat())].sort()
    : ['Todas', ...(AREAS_AND_SPECIALTIES[selectedArea] || [])].sort();

  useEffect(() => {
    const fetchResidencyQuestions = async () => {
      if (!db) {
        console.log('ResidencyQuizSetup - Firestore DB não disponível. Aguardando...');
        return;
      }
      try {
        const publicFlashcardsRef = collection(db, `artifacts/${appId}/public/data/flashcards`);
        const q = query(publicFlashcardsRef, where('type', '==', 'residency'));
        const querySnapshot = await getDocs(q);
        const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('ResidencyQuizSetup - Questões de residência FETCHED (antes do filtro):', fetchedQuestions.length, fetchedQuestions.map(q => ({id: q.id, area: q.area, specialty: q.specialty, question: q.question.substring(0, 30) + '...'})));

        let filtered = fetchedQuestions;
        if (selectedArea !== 'Todas') {
          filtered = filtered.filter(card => card.area === selectedArea);
          console.log(`ResidencyQuizSetup - Filtrado por Área "${selectedArea}":`, filtered.length);
        }
        if (selectedSpecialty !== 'Todas') {
          filtered = filtered.filter(card => card.specialty === selectedSpecialty);
          console.log(`ResidencyQuizSetup - Filtrado por Especialidade "${selectedSpecialty}":`, filtered.length);
        }
        setAvailableQuestions(filtered);
        console.log('ResidencyQuizSetup - Questões de residência FILTRADAS (final):', filtered.length);
      } catch (error) {
        console.error("ResidencyQuizSetup - Erro ao buscar questões de residência públicas:", error);
        setError("Erro ao carregar questões de residência: " + error.message);
      }
    };
    fetchResidencyQuestions();
  }, [db, appId, selectedArea, selectedSpecialty, setError]);

  const handleStartQuiz = () => {
    console.log('handleStartQuiz - Título do Quiz:', quizTitle);
    console.log('handleStartQuiz - Questões disponíveis ANTES do shuffle/slice:', availableQuestions.length);

    if (quizTitle.trim() === '') {
      setError("Por favor, dê um nome ao seu bloco de questões.");
      return;
    }

    if (availableQuestions.length === 0) {
      setError("Não há questões disponíveis com os filtros selecionados.");
      console.error("handleStartQuiz - Não há questões disponíveis com os filtros selecionados.");
      return;
    }

    // Shuffle and select questions
    const shuffledQuestions = [...availableQuestions].sort(() => 0.5 - Math.random());
    const questionsForQuiz = shuffledQuestions.slice(0, Math.min(numberOfQuestions, shuffledQuestions.length));

    console.log('handleStartQuiz - Questões selecionadas para o quiz:', questionsForQuiz.length);

    if (questionsForQuiz.length === 0) {
      setError("Não foi possível montar um quiz com as questões disponíveis e a quantidade solicitada.");
      console.error("handleStartQuiz - Não foi possível montar um quiz com as questões disponíveis e a quantidade solicitada.");
      return;
    }

    onStartQuiz(questionsForQuiz, quizTitle); // Pass quizTitle
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Configurar Quiz de Residência</h2>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="quizTitle" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nome do Bloco de Questões:</label>
          <input
            type="text"
            id="quizTitle"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300'}`}
            placeholder="Ex: Quiz de Cardiologia - Prova 2023"
            required
          />
        </div>

        <div>
          <label htmlFor="areaSelect" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Área:</label>
          <select
            id="areaSelect"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
          >
            {availableAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="specialtySelect" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Especialidade:</label>
          <select
            id="specialtySelect"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-800 text-white'}`}
            disabled={!selectedArea}
            required
          >
            <option value="">Selecione uma Especialidade</option>
            {availableSpecialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numQuestions" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Quantidade de Questões:</label>
          <input
            type="number"
            id="numQuestions"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max={availableQuestions.length > 0 ? availableQuestions.length : 1}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300'}`}
          />
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Questões disponíveis com estes filtros: {availableQuestions.length}
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleStartQuiz}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          Iniciar Quiz
        </button>
        <button onClick={onBack} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Voltar
        </button>
      </div>
    </div>
  );
}


// Componente para o Quiz de Residência
function ResidencyQuiz({ quizQuestions, onBack, darkMode, quizName }) { // Adicionado quizName prop
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState(0);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleAnswerSelection = (index) => {
    if (!showResult) { // Only allow selection if result is not shown yet
      setSelectedAnswerIndex(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === null) {
      console.error("ResidencyQuiz - Por favor, selecione uma alternativa antes de enviar.");
      return;
    }
    setShowResult(true);
    setAnsweredQuestionsCount(prev => prev + 1); // Increment count when an answer is submitted
  };

  const handleNextQuestion = () => {
    setSelectedAnswerIndex(null);
    setShowResult(false);
    setShowComment(false);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered in this block
      console.log("ResidencyQuiz - Fim do quiz!");
      onBack(); // Go back to list or quiz setup
    }
  };

  if (!currentQuestion) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-lg mb-4`}>
          Nenhuma questão de residência disponível para quiz.
        </p>
        <button onClick={onBack} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
        {quizName || 'Quiz de Residência'} ({currentQuestionIndex + 1}/{quizQuestions.length})
      </h2>

      <div className={`p-8 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'} min-h-[300px] flex flex-col justify-between`}>
        <p className={`text-xl font-semibold mb-4 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{currentQuestion.question}</p>
        <div className="mb-4 text-left space-y-2">
          {currentQuestion.alternatives.map((alt, index) => {
            const isCorrect = index === currentQuestion.correctAnswerIndex;
            const isSelected = index === selectedAnswerIndex;
            let textColorClass = darkMode ? 'text-gray-300' : 'text-gray-700';
            let borderColorClass = '';

            if (showResult) {
              if (isCorrect) {
                textColorClass = 'text-green-600 font-bold';
                borderColorClass = 'border-green-500';
              } else if (isSelected && !isCorrect) {
                textColorClass = 'text-red-600 font-bold';
                borderColorClass = 'border-red-500';
              }
            } else if (isSelected) {
              borderColorClass = 'border-indigo-500'; // Highlight selected before checking
            }

            return (
              <div
                key={index}
                className={`flex items-center p-2 rounded-lg border-2 ${borderColorClass} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all duration-200 cursor-pointer`}
                onClick={() => handleAnswerSelection(index)}
              >
                <input
                  type="radio"
                  name="quizAnswer"
                  checked={isSelected}
                  onChange={() => handleAnswerSelection(index)}
                  disabled={showResult}
                  className="form-radio text-indigo-600 mr-2"
                />
                <label className={`${textColorClass} cursor-pointer`}>
                  {String.fromCharCode(65 + index)}. {alt.text}
                </label>
              </div>
            );
          })}
        </div>

        {!showResult && (
          <button
            onClick={handleSubmitAnswer}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md mt-4"
            disabled={selectedAnswerIndex === null}
          >
            Verificar Resposta
          </button>
        )}

        {showResult && (
          <div className="mt-4">
            {selectedAnswerIndex === currentQuestion.correctAnswerIndex ? (
              <p className="text-green-600 font-bold text-lg">Correto!</p>
            ) : (
              <p className="text-red-600 font-bold text-lg">Incorreto. A resposta correta é {String.fromCharCode(65 + currentQuestion.correctAnswerIndex)}.</p>
            )}

            {currentQuestion.comment && (
              <button
                onClick={() => setShowComment(!showComment)}
                className={`mt-4 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} hover:text-indigo-600 transition-colors flex items-center justify-center mx-auto`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {showComment ? 'Ocultar Comentário' : 'Visualizar Comentário'}
              </button>
            )}
            {showComment && currentQuestion.comment && (
              <div className={`mt-2 p-3 rounded-lg text-left ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                <p className="font-medium">Comentário:</p>
                <p>{currentQuestion.comment}</p>
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md mt-4"
              disabled={answeredQuestionsCount <= currentQuestionIndex} // Disable if not answered
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Concluir Quiz' : 'Próxima Questão'}
            </button>
          </div>
        )}
      </div>
      <button onClick={onBack} className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
        Voltar
      </button>
    </div>
  );
}

// Componente para Importar/Exportar Flashcards (Esboço)
function ImportExport({ flashcards, onImport, onBack, darkMode }) {
  const [importText, setImportText] = useState('');

  const handleExport = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'flashcards.json';
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    try {
      const importedCards = JSON.parse(importText);
      if (Array.isArray(importedCards)) {
        importedCards.forEach(card => onImport(card));
        setImportText('');
      } else {
      }
    } catch (e) {
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Importar/Exportar Flashcards</h2>

      <div className="mb-6">
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Exportar</h3>
        <button
          onClick={handleExport}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          Exportar para JSON
        </button>
      </div>

      <div>
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Importar (Cole JSON aqui)</h3>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows="10"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-100' : 'border-gray-300'}`}
          placeholder='[{ "question": "...", "answer": "...", "discipline": "..." }]'
        ></textarea>
        <button
          onClick={handleImport}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          Importar
        </button>
      </div>

      <button onClick={onBack} className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
        Voltar
      </button>
    </div>
  );
}

// Componente para Compartilhar Flashcards (Esboço)
function ShareFlashcards({ userId, db, appId, onBack, setMessage, setError, darkMode }) {
  const [shareTargetUserId, setShareTargetUserId] = useState('');
  const [publicFlashcards, setPublicFlashcards] = useState([]);

  const fetchPublicFlashcards = useCallback(async () => {
    if (!db) return;
    try {
      const publicCollectionRef = collection(db, `artifacts/${appId}/public/data/flashcards`);
      const q = query(publicCollectionRef);
      const querySnapshot = await getDocs(q);
      const fetchedCards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPublicFlashcards(fetchedCards);
      setMessage('Flashcards públicos carregados.');
    } catch (e) {
      console.error("ShareFlashcards - Erro ao buscar flashcards públicos: ", e);
      setError("Erro ao carregar flashcards públicos: " + e.message);
    }
  }, [db, appId, setMessage, setError]);

  useEffect(() => {
    fetchPublicFlashcards();
  }, [fetchPublicFlashcards]);

  const handleShareToPublic = async () => {
    if (!db || !userId) {
      setError('Usuário não autenticado ou Firestore não disponível.');
      return;
    }
    try {
      const userFlashcardsRef = collection(db, `artifacts/${appId}/users/${userId}/flashcards`);
      const publicFlashcardsRef = collection(db, `artifacts/${appId}/public/data/flashcards`);
      const userSnapshot = await getDocs(userFlashcardsRef);

      for (const docSnapshot of userSnapshot.docs) {
        const flashcardData = docSnapshot.data();
        await addDoc(publicFlashcardsRef, { ...flashcardData, ownerId: userId, sharedAt: serverTimestamp() });
      }
      setMessage('Seus flashcards foram compartilhados publicamente!');
      fetchPublicFlashcards();
    } catch (e) {
      console.error("ShareFlashcards - Erro ao compartilhar publicamente: ", e);
      setError("Erro ao compartilhar publicamente: " + e.message);
    }
  };

  const handleImportPublicFlashcard = async (card) => {
    if (!db || !userId) {
      setError('Usuário não autenticado ou Firestore não disponível.');
      return;
    }
    try {
      const userFlashcardsRef = collection(db, `artifacts/${appId}/users/${userId}/flashcards`);
      const existingCardQuery = query(userFlashcardsRef, where('question', '==', card.question), where('answer', '==', card.answer));
      const existingSnapshot = await getDocs(existingCardQuery);

      if (existingSnapshot.empty) {
        await addDoc(userFlashcardsRef, {
          question: card.question,
          answer: card.answer,
          discipline: card.discipline || 'Importado',
          createdAt: serverTimestamp(),
          lastReviewedAt: null,
          nextReviewAt: null,
          reviewCount: 0,
          easeFactor: 2.5,
          interval: 0,
          originalOwnerId: card.ownerId || 'unknown'
        });
        setMessage(`Flashcard "${card.question}" importado com sucesso!`);
      } else {
        setMessage(`Flashcard "${card.question}" já existe em sua coleção.`);
      }
    } catch (e) {
      console.error("ShareFlashcards - Erro ao importar flashcard público: ", e);
      setError("Erro ao importar flashcard público: " + e.message);
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Compartilhar Flashcards</h2>

      <div className="mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Compartilhar Meus Flashcards Publicamente</h3>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
          Torne todos os seus flashcards visíveis e importáveis por outros usuários.
        </p>
        <button
          onClick={handleShareToPublic}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          Compartilhar Publicamente
        </button>
      </div>

      <div className="mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Importar Flashcards Públicos</h3>
        {publicFlashcards.length === 0 ? (
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nenhum flashcard público disponível para importação.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicFlashcards.map(card => (
              <div key={card.id} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'}`}>
                <p className={`font-semibold ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{card.question}</p>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mb-2`}>{card.answer}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Disciplina: {card.discipline || 'N/A'}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Criador: {card.ownerId || 'Desconhecido'}</p>
                <button
                  onClick={() => handleImportPublicFlashcard(card)}
                  className="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-300 ease-in-out"
                >
                  Importar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onBack} className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
        Voltar
      </button>
    </div>
  );
}

// Componente de Estatísticas
function Statistics({ flashcards, disciplines, onBack, darkMode }) {
  const COLORS = ['#4CAF50', '#FFC107', '#F44336']; // Green (Easy), Yellow (Difficult), Red (Forgotten)

  const disciplineStats = useMemo(() => {
    const stats = {};
    flashcards.forEach(card => {
      const disc = card.discipline || 'Sem Disciplina'; // Normalize discipline name
      if (!stats[disc]) {
        stats[disc] = { easy: 0, difficult: 0, forgotten: 0 };
      }
      if (card.reviewStats) {
        stats[disc].easy += card.reviewStats.easy || 0;
        stats[disc].difficult += card.reviewStats.difficult || 0;
        stats[disc].forgotten += card.reviewStats.forgotten || 0;
      }
    });
    return stats;
  }, [flashcards]);

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
      <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Estatísticas de Revisão</h2>

      {Object.keys(disciplineStats).length === 0 ? (
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Nenhum dado de revisão disponível ainda. Comece a revisar seus flashcards!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(disciplineStats).map(([disciplineName, data]) => {
            const total = data.easy + data.difficult + data.forgotten;
            if (total === 0) return null;

            const chartData = [
              { name: 'Fácil', value: data.easy },
              { name: 'Difícil', value: data.difficult },
              { name: 'Esqueci', value: data.forgotten },
            ].filter(item => item.value > 0);

            return (
              <div key={disciplineName} className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-100'}`}>
                <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{disciplineName}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onBack} className="mt-6 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md">
        Voltar
      </button>
    </div>
  );
}

export default App;
