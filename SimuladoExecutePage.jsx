// Importa o React e os hooks necessários
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Importa funções do Firebase Firestore
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc, orderBy, onSnapshot, getDoc, limit, startAfter, documentId } from 'firebase/firestore';
// Importa componentes de gráficos do Recharts
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
// Importa ícones do Lucide React
import { ChevronLeft, ChevronRight, MessageSquare, PlayCircle, PauseCircle, X, Settings, ListChecks, TimerIcon, ChevronDown, ChevronUp, Clock, BookMarked, FlaskConical, Stethoscope, Scissors, Baby, HeartPulse, ShieldCheck, FileText, Scale } from 'lucide-react';
// Importa componentes de animação do Framer Motion
import { motion, AnimatePresence } from 'framer-motion';
// Importa o useNavigate para navegação programática
import { useNavigate } from 'react-router-dom';

// Componente LoadingSpinner
// Exibe um spinner de carregamento simples.
function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center h-full w-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="ml-4 text-lg text-gray-600">Carregando...</p>
        </div>
    );
}

// Componente ZoomableImageModal
// Este componente exibe uma imagem em um modal que pode ser ampliada e arrastada.
function ZoomableImageModal({ src, onClose }) {
    // Estado para o nível de zoom da imagem, agora com zoom inicial de 2x
    const [zoomLevel, setZoomLevel] = useState(2);
    // Estado para a origem da transformação (ponto de zoom), fixado no centro
    const [transformOrigin, setTransformOrigin] = useState('center center');
    // Estado para a translação da imagem (para arrastar)
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    // Estado para verificar se a imagem está sendo arrastada
    const [isDragging, setIsDragging] = useState(false);
    // Estado para armazenar o ponto inicial do arrasto
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    // Ref para o elemento da imagem
    const imageRef = useRef(null);
    // Ref para o contêiner do modal
    const containerRef = useRef(null);

    // Callback para lidar com o evento de rolagem (zoom)
    const handleWheel = useCallback((e) => {
        e.preventDefault(); // Previne o comportamento padrão de rolagem da página
        const scaleAmount = 0.1; // Quantidade de zoom por rolagem
        // Calcula o novo nível de zoom
        let newZoomLevel = e.deltaY < 0 ? zoomLevel + scaleAmount : zoomLevel - scaleAmount;
        newZoomLevel = Math.max(1, Math.min(newZoomLevel, 5)); // Limita o zoom entre 1x e 5x

        setZoomLevel(newZoomLevel); // Atualiza o nível de zoom
        // Se o zoom voltar para 1x, reseta a translação
        if (newZoomLevel === 1) {
            setTranslate({ x: 0, y: 0 });
        }
        // transformOrigin é sempre 'center center', então não há lógica para mudar aqui.
    }, [zoomLevel]); // Dependências: zoomLevel

    // Callback para lidar com o início do arrasto (mousedown)
    const handleMouseDown = useCallback((e) => {
        if (zoomLevel > 1 && imageRef.current) { // Apenas permite arrastar se houver zoom
            setIsDragging(true); // Ativa o modo de arrasto
            // Calcula o ponto de início do arrasto
            setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
            imageRef.current.style.cursor = 'grabbing'; // Altera o cursor para "agarrando"
        }
    }, [zoomLevel, translate]); // Dependências: zoomLevel, translate

    // Callback para lidar com o arrasto (mousemove)
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return; // Ignora se não estiver arrastando
        const newTranslateX = e.clientX - dragStart.x; // Calcula nova translação X
        const newTranslateY = e.clientY - dragStart.y; // Calcula nova translação Y
        setTranslate({ x: newTranslateX, y: newTranslateY }); // Atualiza a translação
    }, [isDragging, dragStart]); // Dependências: isDragging, dragStart

    // Callback para lidar com o fim do arrasto (mouseup)
    const handleMouseUp = useCallback(() => {
        setIsDragging(false); // Desativa o modo de arrasto
        if (imageRef.current) {
            imageRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in'; // Reseta o cursor
        }
    }, [zoomLevel]); // Dependências: zoomLevel

    // Efeito para adicionar e remover o listener de rolagem
    useEffect(() => {
        const currentRef = containerRef.current;
        if (currentRef) {
            // Adiciona o listener de rolagem com { passive: false } para permitir preventDefault
            currentRef.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('wheel', handleWheel); // Limpeza do listener
            }
        };
    }, [handleWheel]); // Dependências: handleWheel

    // Memoiza o estilo da imagem para evitar recálculos desnecessários
    const imageStyle = useMemo(() => ({
        transform: `scale(${zoomLevel}) translate(${translate.x}px, ${translate.y}px)`, // Aplica zoom e translação
        transformOrigin: 'center center', // Define a origem da transformação fixamente no centro
        cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in', // Define o cursor
        transition: isDragging ? 'none' : 'transform 0.1s ease-out', // Transição suave apenas quando não arrastando
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
    }), [zoomLevel, translate, isDragging]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onMouseMove={handleMouseMove} // Lida com o arrasto
            onMouseUp={handleMouseUp}     // Lida com o fim do arrasto
            onMouseLeave={handleMouseUp} // Para de arrastar se o mouse sair da janela
        >
            <div className="relative max-w-full max-h-full flex items-center justify-center">
                <button
                    onClick={onClose} // Fechar o modal
                    className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 z-50"
                    title="Fechar"
                >
                    <X className="h-6 w-6" /> {/* Ícone de fechar */}
                </button>
                <div
                    className="overflow-hidden flex items-center justify-center"
                    style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: 'calc(100vh - 4rem)', // Ajusta para padding/botão
                        maxWidth: 'calc(100vw - 4rem)'
                    }}
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt=""
                        style={imageStyle}
                        onMouseDown={handleMouseDown} // Lida com o início do arrasto
                        onError={(e) => e.target.src = 'https://placehold.co/800x600/cccccc/ffffff?text=Image+Error'} // Fallback para erro de imagem
                    />
                </div>
            </div>
        </div>
    );
}

// Componente AlertModal
// Exibe um modal de alerta ou confirmação.
function AlertModal({ message, type, onClose, onConfirm }) {
    if (!message) return null; // Não renderiza se não houver mensagem

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
                <p className="text-lg mb-4 text-gray-800">{message}</p>
                {type === 'confirm' ? ( // Se for um modal de confirmação, exibe dois botões
                    <div className="flex justify-around mt-4">
                        <button
                            onClick={onConfirm} // Botão de confirmação
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow transition duration-200 transform hover:scale-105"
                        >
                            Sim
                        </button>
                        <button
                            onClick={onClose} // Botão de cancelamento
                            className="bg-gray-400 hover:bg-gray-500 text-gray-800 font-bold py-2 px-4 rounded-xl shadow transition duration-200 transform hover:scale-105"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : ( // Caso contrário, exibe apenas um botão "Ok"
                    <div className="mt-4">
                        <button
                            onClick={onClose} // Botão "Ok"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Ok
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Componente StatisticsModal
// Exibe um relatório de desempenho do simulado com gráficos.
export function StatisticsModal({ performanceReport, onClose }) {
    if (!performanceReport) {
        return null; // Não renderiza se não houver relatório
    }

    // Desestruturação dos dados do relatório
    const { totalQuestions, correctAnswers, incorrectAnswers, unansweredQuestions, percentageCorrect, timeTaken, recommendedTotalTime, areaStats } = performanceReport;

    // Dados para o gráfico de pizza: Distribuição de acertos, erros e não respondidas.
    const dataPie = [
        { name: 'Corretas', value: correctAnswers, color: '#4CAF50' }, // Verde
        { name: 'Incorretas', value: incorrectAnswers, color: '#F44336' }, // Vermelho
        { name: 'Não Respondidas', value: unansweredQuestions, color: '#FFEB3B' }, // Amarelo
    ];

    // Função para formatar o tempo em HH:MM:SS
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00:00";
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-auto relative">
                <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Estatísticas do Simulado</h2>
                <div className="mb-4 text-center">
                    <p className="text-lg text-gray-700"><strong>Data:</strong> {performanceReport.creationDate}</p>
                    {/* Exibe o tempo gasto se disponível */}
                    {timeTaken !== undefined && timeTaken !== null && (
                        <p className="text-lg text-gray-700">
                            <strong>Tempo Gasto:</strong> {formatTime(timeTaken)}
                        </p>
                    )}
                    {/* Exibe o tempo recomendado se disponível */}
                    {recommendedTotalTime !== undefined && recommendedTotalTime !== null && (
                        <p className="text-lg text-gray-700">
                            <strong>Tempo Preconizado:</strong> {formatTime(recommendedTotalTime)}
                        </p>
                    )}
                </div>
                {/* Seção de métricas principais: Corretas, Incorretas, Não Respondidas, Total */}
                <div className="grid grid-cols-2 gap-4 text-center mb-6">
                    <div className="bg-green-100 p-3 rounded-xl">
                        <p className="text-xl font-bold text-green-700">{correctAnswers}</p>
                        <p className="text-sm text-green-600">Corretas</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-xl">
                        <p className="text-xl font-bold text-red-700">{incorrectAnswers}</p>
                        <p className="text-sm text-red-600">Incorretas</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-xl">
                        <p className="text-xl font-bold text-yellow-700">{unansweredQuestions}</p>
                        <p className="text-sm text-yellow-600">Não Respondidas</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <p className="text-xl font-bold text-blue-700">{totalQuestions}</p>
                        <p className="text-sm text-blue-600">Total</p>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-2xl font-bold text-indigo-800">Aproveitamento Geral: {percentageCorrect}%</p>
                </div>

                {/* Seção de gráficos */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gráfico de Pizza: Mostra a proporção de respostas corretas, incorretas e não respondidas */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">Distribuição de Acertos</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <Pie
                                    data={dataPie}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                    // Rótulos do gráfico de pizza para exibir a porcentagem
                                    label={({ cx, cy, midAngle, outerRadius, percent }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = outerRadius * 0.9;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(Math.sin(-midAngle * RADIAN));

                                        return (
                                            <text
                                                x={x}
                                                y={y}
                                                fill="black"
                                                textAnchor={x > cx ? 'start' : 'end'}
                                                dominantBaseline="central"
                                                stroke="none"
                                            >
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    {dataPie.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                {/* Tooltip para mostrar detalhes ao passar o mouse */}
                                <Tooltip formatter={(value, name, props) => [`${value} questões`, props.payload.name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Gráfico de Barras por Área: Mostra o desempenho percentual em cada área */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">Desempenho por Área (%)</h3>
                        {areaStats && areaStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                    // Mapeia os dados de areaStats para o formato esperado pelo BarChart
                                    data={areaStats.map(stat => ({ area: stat.area, porcentagem: parseFloat(stat.percentage.toFixed(2)) }))}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <XAxis dataKey="area" angle={-45} textAnchor="end" height={80} interval={0} />
                                    <YAxis />
                                    {/* Tooltip para mostrar a porcentagem ao passar o mouse */}
                                    <Tooltip formatter={(value) => [`${value}%`]} />
                                    <Legend />
                                    <Bar dataKey="porcentagem" fill="#8884d8" />

                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-gray-500">Nenhum dado por área disponível.</p>
                        )}
                    </div>
                </div>

                {/* Botão de Fechar */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente para exibir uma única questão
const QuestionDisplay = ({ question, questionIndex, totalQuestions, userAnswer, isReviewMode, onAnswerChange, onToggleComment, isCommentVisible, onToggleErrorQuestion, isErrorQuestion, onImageClick, currentFontSize, darkMode, onToggleReviewMark, isMarkedForReview, onUpdateRiscadoAlternatives, areaIconsMap }) => {
    // Estados para o player de podcast
    const [podcastActive, setPodcastActive] = useState(false);
    const [podcastIsPlaying, setPodcastIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioError, setAudioError] = useState(null);
    const audioRef = useRef(null);
    // Estado local para alternativas riscadas
    const [riscadoAlternatives, setRiscadoAlternatives] = useState(() => userAnswer?.riscadoAlternatives || {});

    // Novo estado para o texto da questão a ser exibido (após pré-processamento)
    const [displayQuestionText, setDisplayQuestionText] = useState('');
    // Novo estado para a URL da imagem da questão a ser exibida (extraída ou da prop)
    const [displayQuestionImageSrc, setDisplayQuestionImageSrc] = useState('');
    // Novo estado para erro de imagem local
    const [imageLoadErrorLocal, setImageLoadErrorLocal] = useState(false);
    // Novo estado para verificar se a string da imagem é válida
    const [hasValidImageSrc, setHasValidImageSrc] = useState(false);

    // Efeito para pré-processar o texto da questão e extrair a imagem
    useEffect(() => {
        setImageLoadErrorLocal(false); // Reseta o estado de erro para a nova questão

        let processedText = question.question;
        let extractedImageSrc = question.questionImage; // Inicia com o valor da prop

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(question.question, 'text/html');
            const imgElement = doc.querySelector('img');

            if (imgElement) {
                // Se uma imagem for encontrada no texto da questão, extrai seu src
                extractedImageSrc = imgElement.getAttribute('src');

                // Remove o elemento img e qualquer <p> ou <br> vazio que o contenha
                let tempNode = imgElement;
                let elementsToRemove = [imgElement];

                // Traverse up to find empty <p> or <br> parents
                while (tempNode && tempNode.parentNode) {
                    const parent = tempNode.parentNode;
                    const children = Array.from(parent.children);
                    const hasOtherContent = children.some(child =>
                        child !== tempNode && (child.tagName !== 'P' || child.textContent.trim() !== '' || child.querySelector('img'))
                    );

                    if (!hasOtherContent && (parent.tagName === 'P' || parent.tagName === 'BR')) {
                        elementsToRemove.push(parent);
                        tempNode = parent;
                    } else {
                        break;
                    }
                }

                elementsToRemove.forEach(el => el.remove());

                // Get the cleaned HTML string from the body
                processedText = doc.body.innerHTML.trim();
            }

            // Limpeza adicional de padrões comuns de tags vazias ou de quebra de linha
            // processedText = processedText.replace(/<p>\s*<br>\s*<\/p>/g, '').trim();
            // processedText = processed(Text.replace(/<p>\s*<\/p>/g, '').trim();
            // processedText = processedText.replace(/<br\s*\/?>/g, '').trim();

        } catch (e) {
            console.error("Erro ao analisar o HTML da questão:", e);
            // Fallback para o texto original se a análise falhar
            processedText = question.question;
        }

        setDisplayQuestionText(processedText);
        setDisplayQuestionImageSrc(extractedImageSrc);

        // Valida a src da imagem para renderização
        if (typeof extractedImageSrc === 'string' && extractedImageSrc.trim() !== '') {
            const isHttpImage = extractedImageSrc.startsWith('http://') || extractedImageSrc.startsWith('https://');
            const isValidBase64Image = extractedImageSrc.startsWith('data:image/') && extractedImageSrc.length > 100; // Aumenta o mínimo de tamanho
            setHasValidImageSrc(isHttpImage || isValidBase64Image); // Corrigido para isValidBase64Image
        } else {
            setHasValidImageSrc(false);
        }
    }, [question.id, question.question, question.questionImage]); // Depende do ID da questão e da string da imagem


    // Estilo do texto da questão (tamanho da fonte)
    const questionTextStyle = useMemo(() => ({ fontSize: `${currentFontSize}px` }), [currentFontSize]);

    // Formata o tempo para exibição no player de podcast (MM:SS)
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Alterna a visibilidade do player de podcast
    const handleTogglePodcast = useCallback(() => {
        setPodcastActive(prev => {
            if (prev) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    setPodcastIsPlaying(false);
                }
            } else {
                setAudioError(null);
                if (audioRef.current && question.podcastUrl) {
                    audioRef.current.load(); // Carrega o áudio ao ativar o player
                }
            }
            return !prev;
        });
    }, [question.podcastUrl]);

    // Toca ou pausa o podcast
    const handlePlayPausePodcast = useCallback(() => {
        if (audioRef.current) {
            if (podcastIsPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(error => {
                    setAudioError("Não foi possível tocar o áudio. Verifique a URL ou o formato do arquivo.");
                    setPodcastIsPlaying(false);
                });
            }
            setPodcastIsPlaying(!podcastIsPlaying);
        }
    }, [podcastIsPlaying]);

    // Atualiza o tempo atual do podcast
    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, []);

    // Reseta o player quando o áudio termina
    const handleAudioEnded = useCallback(() => {
        setPodcastIsPlaying(false);
        setCurrentTime(0);
    }, []);

    // Permite ao utilizador buscar no áudio (barra de progresso)
    const handleSeekPodcast = useCallback((e) => {
        if (audioRef.current) {
            audioRef.current.currentTime = e.target.value;
            setCurrentTime(e.target.value);
        }
    }, []);

    // Lida com erros de carregamento do áudio
    const handleAudioError = useCallback((e) => {
        let errorMessage = "Ocorreu um erro ao carregar o áudio.";
        switch (e.target.error.code) {
            case e.target.error.MEDIA_ERR_ABORTED:
                errorMessage = "A reprodução de áudio foi interrompida.";
                break;
            case e.target.error.MEDIA_ERR_NETWORK:
                errorMessage = "Erro de rede ao carregar o áudio.";
                break;
            case e.target.error.MEDIA_ERR_DECODE:
                errorMessage = "O áudio não pôde ser descodificado (formato não suportado).";
                break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = "A URL do áudio está inválida ou o formato não é suportado.";
                break;
            default:
                errorMessage = "Ocorreu um erro desconhecido ao carregar o áudio.";
                break;
        }
        setAudioError(errorMessage);
        setPodcastIsPlaying(false);
    }, []);

    // Reseta o estado do player de podcast e alternativas riscadas
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setPodcastIsPlaying(false);
            setCurrentTime(0);
            setPodcastActive(false);
            setAudioError(null);
            if (question.podcastUrl) {
                audioRef.current.load();
            }
        }
        // Inicializa riscadoAlternatives com base na resposta do usuário
        setRiscadoAlternatives(userAnswer?.riscadoAlternatives || {});
    }, [question.id, isReviewMode, question.podcastUrl, userAnswer]);

    // Alterna o estado "riscado" para uma alternativa
    const handleToggleRiscado = useCallback((letter, e) => {
        e.stopPropagation(); // Previne que o botão de rádio seja marcado
        setRiscadoAlternatives(prev => {
            const newRiscado = {
                ...prev,
                [letter]: !prev[letter] // Inverte o estado riscado para a letra
            };
            onUpdateRiscadoAlternatives(question.id, newRiscado); // Notifica o componente pai
            return newRiscado;
        });
    }, [onUpdateRiscadoAlternatives, question.id]);

    // Memoiza as alternativas para renderização eficiente
    const alternativesHtml = useMemo(() => question.alternatives.map((alt, altIndex) => {
        const letter = String.fromCharCode(65 + altIndex); // Converte índice para letra (A, B, C...)
        const isDisabled = isReviewMode; // Desabilita em modo de revisão
        const isChecked = userAnswer?.selectedAnswer === letter; // Verifica se a alternativa está selecionada
        const isRiscado = riscadoAlternatives[letter]; // Verifica se a alternativa está riscada

        const classNames = [
            'p-3', 'rounded-md', 'flex', 'items-center', 'relative',
            'transition', 'duration-200', 'group'
        ];

        // Estilização condicional baseada no modo (revisão ou ativo)
        if (isReviewMode) {
            if (letter === question.correctAnswer) {
                classNames.push('bg-green-100'); // Alternativa correta
            } else if (isChecked && letter !== question.correctAnswer) {
                classNames.push('bg-red-100'); // Alternativa incorreta selecionada
            } else {
                 classNames.push('bg-gray-50'); // Não selecionada em revisão
            }
        } else {
            if (isChecked) {
                classNames.push('bg-blue-100'); // Alternativa selecionada em modo ativo
            } else {
                classNames.push('bg-gray-50', 'hover:bg-gray-100', 'cursor-pointer'); // Não selecionada em modo ativo
            }
        }

        // Estilização para Dark Mode
        if (darkMode) {
            if (letter === question.correctAnswer && isReviewMode) {
                classNames.push('text-gray-900');
            } else if (isChecked && letter !== question.correctAnswer && isReviewMode) {
                classNames.push('text-gray-900');
            } else if (isChecked && !isReviewMode) {
                classNames.push('text-gray-900');
            } else {
                classNames.push('dark:bg-gray-600', 'dark:text-gray-200');
            }
            if (!isReviewMode && !isDisabled) {
                classNames.push('dark:hover:bg-gray-500');
            }
        } else {
            // Estilização para Light Mode
            classNames.push('text-gray-800');
            if (letter === question.correctAnswer && isReviewMode) {
                classNames.push('text-green-800');
            } else if (isChecked && letter !== question.correctAnswer && isReviewMode) {
                classNames.push('text-red-800');
            } else if (isChecked) {
                classNames.push('text-blue-800');
            }
        }

        let liClass = classNames.join(' ');

        return (
            <li
                key={letter}
                id={`alternative-${question.id}-${letter}`}
                className={liClass}
                onClick={!isDisabled ? (e) => onAnswerChange(question.id, letter) : undefined}
            >
                <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={letter}
                    className="alternative-radio mr-2 flex-shrink-0"
                    id={`radio-${question.id}-${letter}`}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                />
                {/* Ícone de tesoura para "riscar" alternativa */}
                {!isDisabled && ( // Exibe apenas em modo ativo
                    <button
                        type="button"
                        onClick={(e) => handleToggleRiscado(letter, e)}
                        className={`absolute right-3 p-1 rounded-full text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0
                            ${isRiscado ? 'opacity-100 text-red-500' : ''}`}
                        title={isRiscado ? 'Desriscar alternativa' : 'Riscar alternativa'}
                    >
                        <Scissors className="h-6 w-6" />
                    </button>
                )}

                <label
                    htmlFor={`radio-${question.id}-${letter}`}
                    className={`alternative-label flex-1 cursor-pointer mr-8 ${isRiscado ? 'line-through opacity-70' : ''}`}
                    style={questionTextStyle}
                >
                    {letter}) {alt}
                </label>
            </li>
        );
    }), [question, userAnswer, isReviewMode, onAnswerChange, darkMode, riscadoAlternatives, handleToggleRiscado, questionTextStyle]);

    // Classe CSS para o cartão da questão (modo claro/escuro)
    const questionCardClass = `question-card p-6 rounded-2xl shadow-md relative ${
        darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-200 text-gray-800'
    }`;

    // Obtém o ícone da área da questão
    const AreaIconComponent = question.area ? areaIconsMap[question.area] : null;

    return (
        <div className={questionCardClass} id={`question-card-${question.id}`}>
            {/* Seção superior do cartão da questão (Número da Questão e Ícone da Área) */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-900 dark:border-blue-900">
                <div className="flex items-center">
                    <h3 className="font-bold text-xl flex items-center">
                        Questão {questionIndex + 1} de {totalQuestions}
                        {AreaIconComponent && <span className="ml-3">{AreaIconComponent}</span>}
                    </h3>
                </div>
            </div>

            {/* Renderiza o texto da questão usando dangerouslySetInnerHTML */}
            <p className={`mb-4`} style={questionTextStyle} dangerouslySetInnerHTML={{ __html: displayQuestionText }}></p>

            {/* Condicionalmente renderiza a imagem da questão usando a src extraída/processada */}
            {hasValidImageSrc && !imageLoadErrorLocal && displayQuestionImageSrc && (
                <div className="mt-2 text-center">
                    <img
                        src={displayQuestionImageSrc}
                        alt=""
                        className="max-w-full h-auto rounded-lg shadow-md mx-auto max-h-80 object-contain cursor-zoom-in"
                        onError={() => setImageLoadErrorLocal(true)} // Define o estado de erro local
                        onClick={() => onImageClick(displayQuestionImageSrc)}
                    />
                </div>
            )}
            {/* Mensagem de erro se a imagem for válida e falhar */}
            {hasValidImageSrc && imageLoadErrorLocal && (
                <div className="mt-2 text-center text-red-500 text-sm">
                    Não foi possível carregar a imagem desta questão.
                </div>
            )}
            <h3 className="font-bold text-xl mt-4 mb-2">Alternativas:</h3>
            <ul id={`alternatives-list-${question.id}`} className="space-y-2" style={questionTextStyle}>{alternativesHtml}</ul>

            {/* Ações da questão (Caderno de Erros, Marcar para Revisão, Comentário, Podcast) */}
            <div className="flex flex-wrap justify-center sm:justify-between items-center gap-4 mt-6 pt-4 border-t border-blue-900 dark:border-blue-900">
                {isReviewMode && (
                    <button
                        onClick={(e) => onToggleErrorQuestion(question, !isErrorQuestion)}
                        className={`p-2 rounded-full shadow-sm transition duration-200 flex items-center justify-center
                            ${isErrorQuestion
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                            }`}
                        title={isErrorQuestion ? 'Remover do Caderno de Erros' : 'Adicionar ao Caderno de Erros'}
                    >
                        <ListChecks className="h-6 w-6" />
                        <span className="ml-2 font-semibold hidden sm:inline">Caderno de Erros</span>
                    </button>
                )}

                {!isReviewMode && (
                    <button
                        onClick={() => onToggleReviewMark(question.id)}
                        className={`p-2 rounded-full shadow-sm transition duration-200 flex items-center justify-center
                            ${isMarkedForReview
                                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                            }`}
                        title={isMarkedForReview ? 'Desmarcar para Revisão' : 'Marcar para Revisão'}
                    >
                        <BookMarked className="h-6 w-6" />
                        <span className="ml-2 font-semibold hidden sm:inline">Revisão</span>
                    </button>
                )}

                {isReviewMode && (question.comment || question.podcastUrl) && (
                    <div className="flex space-x-2">
                        {question.comment && (
                            <button
                                onClick={() => onToggleComment(question.id)}
                                className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 flex items-center justify-center dark:bg-purple-700 dark:text-purple-100 dark:hover:bg-purple-600"
                                title={isCommentVisible ? 'Ocultar Comentário' : 'Ver Comentário'}
                            >
                                <MessageSquare className="h-6 w-6" />
                                <span className="ml-2 font-semibold hidden sm:inline">Comentário</span>
                            </button>
                        )}
                        {question.podcastUrl && (
                            <button
                                onClick={handleTogglePodcast}
                                className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 flex items-center justify-center dark:bg-blue-700 dark:text-blue-100 dark:hover:bg-blue-600"
                                title={podcastActive ? 'Ocultar Podcast' : 'Ouvir Podcast'}
                            >
                                {podcastIsPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
                                <span className="ml-2 font-semibold hidden sm:inline">Podcast</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Área de exibição do Comentário */}
            {question.comment && isCommentVisible && isReviewMode && (
                <div
                    className={`comment-display-area p-4 border rounded-md mt-4 ${darkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                    id={`comment-area-${question.id}`}
                    dangerouslySetInnerHTML={{ __html: question.comment }}
                >
                </div>
            )}

            {/* Seção do Player de Podcast */}
            {question.podcastUrl && podcastActive && isReviewMode && (
                <div className={`podcast-player-area mt-4 p-4 border rounded-md flex flex-col items-center ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'}`}>
                    {audioError && (
                        <div className="text-red-600 text-sm mb-2 text-center p-2 rounded-md bg-red-50 border border-red-200 w-full dark:bg-red-900 dark:border-red-700 dark:text-red-300">
                            {audioError}
                        </div>
                    )}
                    <audio
                        ref={audioRef}
                        src={question.podcastUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleAudioEnded}
                        onError={handleAudioError}
                        preload="auto"
                    ></audio>
                    <div className="flex items-center space-x-4 w-full">
                        <button
                            onClick={handlePlayPausePodcast}
                            className="p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-700 transition duration-200 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                            disabled={audioError}
                        >
                            {podcastIsPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max={audioRef.current && !isNaN(audioRef.current.duration) ? audioRef.current.duration : 0}
                            value={currentTime}
                            onChange={handleSeekPodcast}
                            className="flex-grow h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer range-lg dark:bg-gray-500"
                            disabled={audioError}
                        />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatTime(currentTime)} / {audioRef.current ? formatTime(audioRef.current.duration) : '00:00'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para o Mapa de Questões Retrátil
const QuestionMap = ({ allSimuladoQuestions, userAnswers, currentAbsoluteQuestionIndex, onQuestionSelect, questionReviewStatus, darkMode }) => {
    // Retorna as classes CSS para os botões do mapa de questões
    const getButtonClass = useCallback((q, index) => {
        const isCurrent = index === currentAbsoluteQuestionIndex; // Questão atual
        const isAnswered = userAnswers[q.id]?.selectedAnswer !== undefined && userAnswers[q.id]?.selectedAnswer !== null; // Questão respondida
        const isMarkedForReview = questionReviewStatus.has(q.id); // Questão marcada para revisão

        let baseClasses = "w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm cursor-pointer transition-all duration-200";

        let backgroundColorClass;
        let textColorClass;

        if (isCurrent) {
            // Questão atual: azul claro no modo claro, azul escuro no modo escuro. Texto branco para azul escuro.
            backgroundColorClass = `${darkMode ? 'bg-blue-700' : 'bg-blue-100'} border-2 border-blue-500`;
            textColorClass = darkMode ? 'text-white' : 'text-gray-900';
        } else if (isMarkedForReview) {
            // Marcada para revisão: amarelo. Texto deve ser escuro no fundo amarelo.
            backgroundColorClass = "bg-yellow-400 hover:bg-yellow-500";
            textColorClass = 'text-gray-900';
        } else if (isAnswered) {
            // Respondida: azul. Texto deve ser escuro no fundo azul médio.
            backgroundColorClass = "bg-blue-400 hover:bg-blue-500";
            textColorClass = 'text-gray-900';
        } else {
            // Não respondida, não marcada, não atual: cinza escuro no modo claro, cinza mais escuro no modo escuro.
            backgroundColorClass = `${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 hover:bg-gray-800'}`;
            textColorClass = 'text-white'; // Texto sempre branco para garantir a visibilidade.
        }
        return `${baseClasses} ${backgroundColorClass} ${textColorClass}`;
    }, [currentAbsoluteQuestionIndex, userAnswers, questionReviewStatus, darkMode]);

    return (
        <div className={`p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-3 text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Navegação Rápida:</h3>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-96 overflow-y-auto pr-2">
                {allSimuladoQuestions.map((q, index) => (
                    <button
                        key={q.id}
                        className={getButtonClass(q, index)}
                        onClick={() => onQuestionSelect(index)} // Seleciona a questão ao clicar
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Componente para o Mapa por Grande Área
const AreaMap = ({ simuladoData, userAnswers, allSimuladoQuestions, darkMode, currentAbsoluteQuestionIndex, onQuestionSelect, areaIconsMap }) => {

    // Calcula estatísticas em tempo real por área
    const areaStats = useMemo(() => {
        const stats = {};
        if (!Array.isArray(allSimuladoQuestions)) {
            console.warn("AreaMap: allSimuladoQuestions is not an array, returning empty stats.");
            return [];
        }

        allSimuladoQuestions.forEach((q, qIndex) => {
            const areaName = q.area || 'Outras';
            if (!stats[areaName]) {
                stats[areaName] = { total: 0, answered: 0, questions: [] };
            }
            stats[areaName].total++;
            const isAnswered = userAnswers[q.id]?.selectedAnswer;
            if (isAnswered) {
                stats[areaName].answered++;
            }
            stats[areaName].questions.push({
                id: q.id,
                index: qIndex,
                isAnswered: !!isAnswered,
                isCurrent: qIndex === currentAbsoluteQuestionIndex
            });
        });

        Object.keys(areaIconsMap).forEach(areaName => {
            if (areaName !== 'Básicas' && areaName !== 'Outras' && !stats[areaName]) {
                stats[areaName] = { total: 0, answered: 0, questions: [] };
            }
        });

        Object.values(stats).forEach(area => {
            area.questions.sort((a, b) => a.index - b.index);
        });

        return Object.keys(stats).map(name => {
            const currentStats = stats[name];
            // Defensive check for currentStats and its properties
            if (!currentStats || typeof currentStats.answered === 'undefined' || typeof currentStats.total === 'undefined') {
                console.error(`AreaMap: Found undefined or incomplete stats for area: ${name}. Current object:`, currentStats);
                return {
                    name,
                    icon: areaIconsMap[name] || <FileText className="h-6 w-6 mr-2 text-gray-500" />,
                    total: 0,
                    answered: 0,
                    percentage: 0,
                    questions: []
                };
            }

            const percentage = currentStats.total > 0 ? parseFloat(((currentStats.answered / currentStats.total) * 100).toFixed(2)) : 0;

            return {
                name,
                icon: areaIconsMap[name] || <FileText className="h-6 w-6 mr-2 text-gray-500" />,
                total: currentStats.total,
                answered: currentStats.answered,
                percentage: percentage,
                questions: currentStats.questions
            };
        }).filter(area => area.name !== 'Básicas' && area.name !== 'Outras');
    }, [allSimuladoQuestions, userAnswers, currentAbsoluteQuestionIndex, areaIconsMap]);

    // Função auxiliar para estilizar os quadrados das questões
    const getQuestionSquareClass = useCallback((qItem) => {
        // Aumenta o tamanho dos quadrados e o tamanho da fonte para melhor leitura
        let baseClasses = "w-9 h-9 flex items-center justify-center rounded-sm text-base font-bold cursor-pointer transition-all duration-100"; // Aumentado para w-9 h-9, text-base
        if (darkMode) {
            baseClasses += " text-gray-900";
        } else {
            baseClasses += " text-gray-900";
        }

        if (qItem.isCurrent) {
            return `${baseClasses} bg-blue-500 text-white border-2 border-blue-700`; // Questão atual
        } else if (qItem.isAnswered) {
            return `${baseClasses} bg-green-300 hover:bg-green-400`; // Questão respondida
        } else {
            return `${baseClasses} bg-gray-300 hover:bg-gray-400`; // Questão não respondida
        }
    }, [darkMode]);

    return (
        <div className={`p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-3 text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Progresso por Área:</h3>
            <div className="space-y-4">
                {areaStats.map((area, index) => (
                    <div key={area.name} className="flex flex-col">
                        <div className="flex items-center mb-2">
                            <div className={`flex items-center w-40 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {area.icon} {area.name}
                            </div>
                            <div className="flex-grow bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 mr-4">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${area.percentage}%` }}
                                ></div>
                            </div>
                            <div className={`ml-auto text-sm font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                {area.answered}/{area.total} ({area.percentage}%)
                            </div>
                        </div>
                        {area.questions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto pr-2"> {/* Aumenta o gap para melhor espaçamento */}
                                {area.questions.map(qItem => (
                                    <button
                                        key={qItem.id}
                                        className={getQuestionSquareClass(qItem)}
                                        onClick={() => onQuestionSelect(qItem.index)}
                                        title={`Questão ${qItem.index + 1} (${qItem.isAnswered ? 'Respondida' : 'Não Respondida'})`}
                                    >
                                        {qItem.index + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// Componente QuestionCardWrapper
const QuestionCardWrapper = ({ children, darkMode, getRemainingTimeDisplay, currentAbsoluteQuestionIndex, totalQuestions, totalElapsedTime }) => { // Added totalElapsedTime prop
    const mainContainerBg = darkMode ? 'bg-gray-800' : 'bg-white';

    // Determine the timer color based on remaining time
    const timerColorClass = useMemo(() => {
        const totalDurationForSimulado = totalQuestions * 160; // Assuming 160 seconds per question if not specified
        const timeRemaining = Math.max(0, totalDurationForSimulado - totalElapsedTime); // totalElapsedTime is from SimuladoExecutePage

        if (timeRemaining <= 60) { // Less than 1 minute
            return 'text-red-500';
        } else if (timeRemaining <= 300) { // Less than 5 minutes
            return 'text-yellow-500';
        }
        return 'text-white'; // Default color
    }, [totalElapsedTime, totalQuestions]); // Dependencies for memoization

    return (
        <div className={`${mainContainerBg} px-4 pt-16 pb-20 rounded-2xl shadow-xl w-full max-w-full mb-6 border border-gray-200 dark:border-gray-700 relative flex flex-col`} style={{minHeight: '70vh'}}>
            {/* Temporizador movido para o canto superior esquerdo do QuestionCardWrapper */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-blue-700 text-white px-3 py-1 rounded-lg shadow-md z-10">
                <TimerIcon className="h-5 w-5" />
                <span className={`font-semibold text-lg ${timerColorClass}`}>{getRemainingTimeDisplay()}</span>
            </div>
            {/* Número da Questão (X/Total) fixado no canto superior direito */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-blue-700 text-white px-3 py-1 rounded-lg shadow-md z-10">
                <span className="font-semibold text-lg">Questão {currentAbsoluteQuestionIndex + 1} de {totalQuestions}</span>
            </div>
            {/* Área de conteúdo principal para a questão */}
            <div className="flex-grow w-full md::max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    );
};


// Componente principal da página de execução de simulados
function SimuladoExecutePage({ db, auth, userId, isAuthReady, appId,
    initialSimulatedAttemptId, initialIsReviewMode, initialSimuladoData,
    initialElapsedTime, initialQuestionIndex, initialUserAnswers, initialShowAnswersOnlyAtEnd,
    onReturnToSimuladosPage,
    initialViewStatsMode // NOVO: Propriedade para iniciar no modo de estatísticas
}) {
    // Inicializa o hook useNavigate
    const navigate = useNavigate();

    // Estados para Dados da Tentativa Simulada
    // allSimuladoQuestions: Armazena os dados completos de TODAS as questões do simulado.
    const [allSimuladoQuestions, setAllSimuladoQuestions] = useState([]);
    // currentAbsoluteQuestionIndex: Índice da questão atual no array 'allSimuladoQuestions'.
    const [currentAbsoluteQuestionIndex, setCurrentAbsoluteQuestionIndex] = useState(initialQuestionIndex || 0);
    const [currentSimulatedAttemptId, setCurrentSimulatedAttemptId] = useState(initialSimulatedAttemptId || null);
    const [currentSimuladoData, setCurrentSimuladoData] = useState(initialSimuladoData || null);
    const [isReviewMode, setIsReviewMode] = useState(initialIsReviewMode || false);
    // userAnswers: Objeto que armazena as respostas do usuário para cada questão (key: questionId, value: { selectedAnswer, riscadoAlternatives }).
    const [userAnswers, setUserAnswers] = useState({}); // Inicializado como objeto vazio
    // questionCommentVisibility: Controla a visibilidade do comentário para cada questão em modo de revisão.
    const [questionCommentVisibility, setQuestionCommentVisibility] = useState({});
    // totalElapsedTime: Tempo total decorrido no simulado em segundos.
    const [totalElapsedTime, setTotalElapsedTime] = useState(initialElapsedTime || 0);
    // questionReviewStatus: Set de IDs de questões marcadas para revisão.
    const [questionReviewStatus, setQuestionReviewStatus] = useState(new Set());

    // Estado de Carregamento Principal
    // isLoadingQuestions: Rastreia o carregamento inicial de todas as questões.
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

    // Refs para controle do temporizador
    const totalTimerIntervalRef = useRef(null);
    const isTimerRunningRef = useRef(false);

    // Refs para controlar o estado do simulado que já foi carregado, evitando recarregamentos desnecessários.
    const currentSimulatedAttemptIdStateRef = useRef(null);
    const isReviewModeStateRef = useRef(null);
    const currentSimuladoDataStateRef = useRef(null); // Ref para os dados do simulado

    // Estado do Modal de Estatísticas
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [statsModalAttempt, setStatsModalAttempt] = useState(null);

    // Estado do AlertModal (gerenciado internamente para mensagens ao usuário)
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('alert'); // Changed to use useState directly
    const [onAlertConfirm, setOnAlertConfirm] = useState(() => {});
    const [onAlertCancel, setOnAlertCancel] = useState(() => {});


    // Estado para o Caderno de Questões Erradas (Set de IDs de questões)
    const [errorQuestions, setErrorQuestions] = useState(new Set());

    // showAnswersOnlyAtEnd: Controla se o feedback das respostas é mostrado apenas no final do simulado.
    const [showAnswersOnlyAtEnd, setShowAnswersOnlyAtEnd] = useState(initialShowAnswersOnlyAtEnd || false);

    // Estados da UI para Popups do Cabeçalho (Acessibilidade, Mapas)
    const [showAccessibilityPopup, setShowAccessibilityPopup] = useState(false);
    const [showQuestionMap, setShowQuestionMap] = useState(false);
    const [showAreaMap, setShowAreaMap] = useState(false);

    // Estados de Acessibilidade
    const [fontSize, setFontSize] = useState(20); // Tamanho da fonte padrão aumentado para 20px
    const [darkMode, setDarkMode] = useState(false);

    // Modais de Imagem (para ampliação de imagens de questões)
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState('');

    // Refs para conteúdo de pop-up para detectar cliques externos e fechar popups.
    const accessibilityPopupRef = useRef(null);
    const questionMapRef = useRef(null);
    const areaMapRef = useRef(null);


    // Define os ícones para cada área do conhecimento, incluindo cores via className
    const AREA_ICONS = useMemo(() => ({
        'Clínica Médica': <Stethoscope className="h-6 w-6 mr-2 text-blue-500" />,
        'Cirurgia': <Scissors className="h-6 w-6 mr-2 text-red-500" />,
        'Pediatria': <Baby className="h-6 w-6 mr-2 text-green-500" />,
        'Ginecologia e Obstetrícia': <HeartPulse className="h-6 w-6 mr-2 text-pink-500" />,
        'Medicina Preventiva': <ShieldCheck className="h-6 w-6 mr-2 text-purple-500" />,
        'Básicas': <FlaskConical className="h-6 w-6 mr-2 text-yellow-500" />,
        'Outras': <FileText className="h-6 w-6 mr-2 text-gray-500" />,
    }), []);


    // Função para mostrar alertas personalizados de forma consistente
    const alertUser = useCallback((message, type = 'alert', onConfirm = null, onCancel = null) => {
        setAlertMessage(message);
        setAlertType(type);
        setOnAlertConfirm(() => onConfirm); // Armazena a função a ser chamada na confirmação
        setOnAlertCancel(() => onCancel); // Armazena a função a ser chamada no cancelamento
        setShowAlert(true);
    }, []);

    // Função para fechar o modal de alerta
    const handleCloseAlert = useCallback(() => {
        if (alertType === 'confirm' && typeof onAlertCancel === 'function') {
            onAlertCancel(); // Executa o callback de cancelamento se for um diálogo de confirmação
        }
        setShowAlert(false);
        setAlertMessage('');
        setAlertType('alert');
        setOnAlertConfirm(() => {});
        setOnAlertCancel(() => {});
    }, [alertType, onAlertCancel]);

    // Função para confirmar o alerta
    const handleConfirmAlert = useCallback(() => {
        if (typeof onAlertConfirm === 'function') {
            onAlertConfirm(); // Executa o callback de confirmação
        }
        setShowAlert(false); // Fecha o alerta após confirmar
        setAlertMessage('');
        setAlertType('alert');
        setOnAlertConfirm(() => {});
        setOnAlertCancel(() => {});
    }, [onAlertConfirm]);

    // Função para fechar o modal de estatísticas e retornar à página principal de Simulados
    const handleCloseStatsAndReturnToActivities = useCallback(() => {
        setShowStatsModal(false);
        setAllSimuladoQuestions([]); // Resetar questões carregadas
        setCurrentAbsoluteQuestionIndex(0);
        setCurrentSimulatedAttemptId(null);
        setCurrentSimuladoData(null);
        setIsReviewMode(false);
        setUserAnswers({});
        setQuestionCommentVisibility({});
        setQuestionReviewStatus(new Set()); // Reseta o status de revisão
        setTotalElapsedTime(0);
        setIsLoadingQuestions(true); // Resetar o estado de carregamento para a próxima vez
        // Usa `navigate` com o caminho da rota
        if (onReturnToSimuladosPage) {
            navigate(onReturnToSimuladosPage);
        }
    }, [onReturnToSimuladosPage, navigate]);

    // Finaliza tentativa de simulado / Retorna à lista de atividades
    const handleReturnToActivities = useCallback(async () => {
        // Verifica se há um simulado em andamento e se o usuário está autenticado
        if (!currentSimulatedAttemptId || !userId || !db) {
            // Se não há dados, tenta redirecionar para a página semanal se o tipo for semanal,
            // caso contrário, volta para a página geral de simulados.
            if (currentSimuladoData?.type === 'semanal') {
                navigate('/app/simulados'); // Redireciona para a página principal de simulados
            } else {
                handleCloseStatsAndReturnToActivities();
            }
            return;
        }

        // Referência ao documento da tentativa do simulado no Firestore
        const simulatedAttemptDocRef = doc(db, `artifacts/${appId}/users/${userId}/simulatedAttempts`, currentSimulatedAttemptId);
        const latestAttemptSnap = await getDoc(simulatedAttemptDocRef);

        // Verifica se os dados da tentativa existem
        if (!latestAttemptSnap.exists()) {
            alertUser("Erro: Dados da tentativa simulada não encontrados para finalizar.");
            // Se dados não encontrados, e era um simulado semanal, ainda tenta ir para a página semanal.
            if (currentSimuladoData?.type === 'semanal') {
                navigate('/app/simulados'); // Redireciona para a página principal de simulados
            } else {
                handleCloseStatsAndReturnToActivities();
            }
            return;
        }
        const currentAttemptData = latestAttemptSnap.data();
        const simuladoIdOfCurrentAttempt = currentAttemptData?.simuladoId;
        const attemptType = currentAttemptData?.type; // Obter o tipo diretamente dos dados da tentativa

        console.log("DEBUG: simuladoIdOfCurrentAttempt:", simuladoIdOfCurrentAttempt);
        console.log("DEBUG: attemptType (from currentAttemptData):", attemptType);
        console.log("DEBUG: Condition (attemptType === 'semanal'):", (attemptType === 'semanal'));


        // Se o simulado ainda não foi finalizado e não estamos em modo de revisão
        if (!currentAttemptData.isFinished && !isReviewMode) {
            // Para o temporizador se estiver rodando
            if (isTimerRunningRef.current) {
                clearInterval(totalTimerIntervalRef.current);
                totalTimerIntervalRef.current = null;
                isTimerRunningRef.current = false;
            }

            // Confirmação para finalizar o simulado
            alertUser(
                "Você está prestes a sair do simulado. Todas as questões não respondidas serão contabilizadas como incorretas. Deseja continuar?",
                'confirm',
                async () => {
                    const finalTimeTaken = totalElapsedTime; // Tempo total gasto

                    const totalQuestionsCount = allSimuladoQuestions.length; // Total de questões no simulado
                    // Tempo recomendado por questão: 160 segundos (2 minutos e 40 segundos)
                    const RECOMMENDED_TIME_PER_QUESTION_SECONDS = 160;
                    const recommendedTotalTime = totalQuestionsCount * RECOMMENDED_TIME_PER_QUESTION_SECONDS;

                    let correctAnswers = 0;
                    let incorrectAnswers = 0;
                    let unansweredQuestions = 0;
                    const finalAreaPerformance = {}; // Objeto para armazenar desempenho por área

                    // Objetos para armazenar estatísticas detalhadas por área, especialidade e tema
                    const areaDetailedStats = {};
                    const specialtyDetailedStats = {};
                    const themeDetailedStats = {};

                    // Itera sobre TODAS as questões carregadas para calcular as estatísticas
                    allSimuladoQuestions.forEach(q => {
                        const userAnswerData = userAnswers[q.id];
                        const selectedAnswer = userAnswerData?.selectedAnswer; // Resposta selecionada pelo usuário
                        const correctAnswer = q.correctAnswer; // Resposta correta da questão (já carregada)

                        const area = q.area || 'Outras'; // Área da questão
                        const specialty = q.specialty || 'Geral'; // Especialidade da questão
                        const theme = q.theme || 'Não Classificado'; // Tema da questão

                        // Inicializa o desempenho da área se ainda não existir
                        if (!finalAreaPerformance[area]) {
                            finalAreaPerformance[area] = { correct: 0, total: 0 };
                        }
                        finalAreaPerformance[area].total++; // Incrementa o total de questões para a área

                        const isCorrect = (selectedAnswer && String(selectedAnswer) === String(correctAnswer));

                        // Compara a resposta do usuário com a resposta correta
                        if (selectedAnswer) {
                            if (isCorrect) {
                                correctAnswers++; // Incrementa acertos totais
                                finalAreaPerformance[area].correct++; // Incrementa acertos para a área
                            } else {
                                incorrectAnswers++; // Incrementa erros totaos
                            }
                        } else {
                            // Se a questão não foi respondida, conta como incorreta e não respondida
                            incorrectAnswers++;
                            unansweredQuestions++;
                        }

                        // Atualiza estatísticas detalhadas por área, especialidade e tema
                        // Area Stats
                        if (!areaDetailedStats[area]) {
                            areaDetailedStats[area] = { respondidas: 0, acertos: 0 };
                        }
                        areaDetailedStats[area].respondidas++;
                        if (isCorrect) {
                            areaDetailedStats[area].acertos++;
                        }

                        // Specialty Stats
                        if (!specialtyDetailedStats[specialty]) {
                            specialtyDetailedStats[specialty] = { respondidas: 0, acertos: 0 };
                        }
                        specialtyDetailedStats[specialty].respondidas++;
                        if (isCorrect) {
                            specialtyDetailedStats[specialty].acertos++;
                        }

                        // Theme Stats
                        if (!themeDetailedStats[theme]) {
                            themeDetailedStats[theme] = { respondidas: 0, acertos: 0 };
                        }
                        themeDetailedStats[theme].respondidas++;
                        if (isCorrect) {
                            themeDetailedStats[theme].acertos++;
                        }
                    });

                    const finalTotalQuestions = allSimuladoQuestions.length;
                    // Calcula a porcentagem de acerto geral
                    const finalPercentageCorrect = finalTotalQuestions > 0 ? parseFloat(((correctAnswers / finalTotalQuestions) * 100).toFixed(2)) : 0;

                    // Converte o objeto de desempenho por área em um array para o relatório
                    const finalAreaStats = Object.keys(finalAreaPerformance).map(area => ({
                        area: area,
                        correct: finalAreaPerformance[area].correct,
                        total: finalAreaPerformance[area].total,
                        percentage: parseFloat(((finalAreaPerformance[area].correct / finalAreaPerformance[area].total) * 100).toFixed(2))
                    }));

                    // Cria o objeto performanceReport com todas as estatísticas calculadas
                    const performanceReport = {
                        id: currentSimulatedAttemptId,
                        simuladoId: simuladoIdOfCurrentAttempt,
                        creationDate: new Date().toLocaleDateString('pt-BR'),
                        timestamp: Date.now(),
                        totalQuestions: finalTotalQuestions,
                        correctAnswers: correctAnswers,
                        incorrectAnswers: incorrectAnswers,
                        unansweredQuestions: unansweredQuestions,
                        percentageCorrect: finalPercentageCorrect,
                        timeTaken: finalTimeTaken,
                        recommendedTotalTime: recommendedTotalTime,
                        areaStats: finalAreaStats,
                        // Define o tipo do relatório com base no tipo da tentativa
                        type: attemptType === 'semanal' ? 'simulado_semanal' : 'simulated'
                    };

                    // Atualiza o documento da tentativa do simulado com o status final e respostas do usuário
                    await updateDoc(simulatedAttemptDocRef, {
                        isFinished: true,
                        timeTaken: finalTimeTaken,
                        questionOrder: allSimuladoQuestions.map(q => q.id), // Salva a ordem completa das questões
                        markedForReview: Array.from(questionReviewStatus), // Salva questões marcadas para revisão
                        userAnswers: userAnswers // Salva as respostas do usuário
                    });

                    // Salva o relatório de desempenho na coleção 'performanceReports'
                    const performanceReportDocRef = doc(db, `artifacts/${appId}/users/${userId}/performanceReports`, currentSimulatedAttemptId);
                    await setDoc(performanceReportDocRef, performanceReport);

                    // Salva estatísticas detalhadas por área, especialidade e tema para simulados semanais
                    // Verifica se o simulado é semanal (usando o campo 'type' dos dados da tentativa)
                    if (attemptType === 'semanal') { // Usando attemptType para verificação
                        const weeklyResultData = {
                            usuario_id: userId,
                            id_semana: simuladoIdOfCurrentAttempt, // O ID do simulado semanal é a ID da semana
                            acertos: correctAnswers,
                            percentual: finalPercentageCorrect,
                            pontuacao: correctAnswers, // Adicionado o campo pontuacao aqui
                            tempo_segundos: finalTimeTaken,
                            area_stats: areaDetailedStats,
                            especialidade_stats: specialtyDetailedStats,
                            tema_stats: themeDetailedStats,
                            timestamp: Date.now(),
                            isCompleted: true, // ADICIONADO: Campo para indicar que o simulado semanal foi concluído
                            // Adicione aqui a lista de IDs das questões erradas para o relatório semanal
                            errorQuestions: allSimuladoQuestions
                                .filter(q => {
                                    const userAnswerData = userAnswers[q.id];
                                    const selectedAnswer = userAnswerData?.selectedAnswer;
                                    return !(selectedAnswer && String(selectedAnswer) === String(q.correctAnswer));
                                })
                                .map(q => q.id)
                        };
                        const weeklyResultsDocRef = doc(db, `artifacts/${appId}/public/data/resultados_semanal`, `${userId}_${simuladoIdOfCurrentAttempt}`);
                        await setDoc(weeklyResultsDocRef, weeklyResultData, { merge: true });
                    }

                    // Prepara e salva os dados para o ranking público
                    const userNameForRanking = auth?.currentUser?.displayName || 'Usuário Anônimo';
                    const userPhotoForRanking = auth?.currentUser?.photoURL || null;
                    const rankingData = {
                        userId: userId,
                        userName: userNameForRanking,
                        userPhoto: userPhotoForRanking,
                        simuladoId: simuladoIdOfCurrentAttempt,
                        attemptId: currentSimulatedAttemptId,
                        timestamp: Date.now(),
                        totalQuestions: finalTotalQuestions,
                        correctAnswers: correctAnswers,
                        percentageCorrect: finalPercentageCorrect,
                        timeTaken: finalTimeTaken,
                    };
                    const simulatedRankingsRef = collection(db, `artifacts/${appId}/public/data/simulatedRankings`);
                    await setDoc(doc(simulatedRankingsRef, currentSimulatedAttemptId), rankingData);

                    // Atualiza o simulado pai para indicar a última tentativa finalizada
                    if (simuladoIdOfCurrentAttempt) {
                        if (attemptType === 'semanal') { // Usando attemptType para verificação
                            // Para simulados semanais, o status do documento público (isFinished, lastFinishedAttemptId)
                            // deve ser gerenciado por um administrador. Usuários comuns não devem atualizá-lo.
                            // Já registramos o resultado semanal do usuário em `resultados_semanal` e `simulatedAttempts`.
                            console.log("Pulando a atualização do documento público do simulado semanal por um usuário comum (permissão).");
                            // Nenhuma chamada updateDoc aqui para o simulado semanal público
                        } else {
                            // Para simulados manuais, atualiza o documento privado do simulado do usuário
                            const simuladoParentDocRef = doc(db, `artifacts/${appId}/users/${userId}/simulados`, simuladoIdOfCurrentAttempt);
                            await updateDoc(simuladoParentDocRef, {
                                lastFinishedAttemptId: currentSimulatedAttemptId,
                                isFinished: true // Marca o simulado como finalizado
                            });
                        }
                    }

                    // Lógica de redirecionamento para simulados semanais
                    if (attemptType === 'semanal') { // Usando attemptType para verificação
                        localStorage.setItem('simuladoFinalizado', 'true');
                        navigate('/app/simulados'); // Redireciona para a página principal de simulados
                    } else {
                        // Para simulados não semanais, exibe o modal de estatísticas
                        setStatsModalAttempt(performanceReport);
                        setShowStatsModal(true);
                    }
                },
                // Callback para cancelar a finalização (reinicia o temporizador se necessário)
                () => {
                    if (!isTimerRunningRef.current) {
                        totalTimerIntervalRef.current = setInterval(() => {
                            setTotalElapsedTime(prevTime => prevTime + 1);
                        }, 1000);
                        isTimerRunningRef.current = true;
                    }
                }
            );
        } else {
            // Se já está finalizado ou em modo de revisão
            if (attemptType === 'semanal') { // Usando attemptType para verificação
                 // Se for um simulado semanal e já finalizado/em revisão, apenas redireciona para a página semanal
                 navigate('/app/simulados'); // Redireciona para a página principal de simulados
            } else {
                // Para simulados não semanais, usa a lógica existente de fechar e retornar
                handleCloseStatsAndReturnToActivities();
            }
        }
    }, [currentSimulatedAttemptId, isReviewMode, userId, db, alertUser, appId, allSimuladoQuestions, handleCloseStatsAndReturnToActivities, auth, totalElapsedTime, currentSimuladoData, totalTimerIntervalRef, isTimerRunningRef, questionReviewStatus, userAnswers, navigate]);

    // Função para abrir o modal de imagem
    const handleImageClick = useCallback((src) => {
        setModalImageSrc(src);
        setShowImageModal(true);
    }, []);

    // Função para fechar o modal de imagem
    const handleCloseImageModal = useCallback(() => {
        setModalImageSrc('');
        setShowImageModal(false);
    }, []);

    // Formata o tempo total decorrido (HH:MM:SS)
    const formatTotalTime = useCallback((totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    // Calcula o tempo restante para o cronômetro de contagem regressiva no cartão da questão
    const getRemainingTimeDisplay = useCallback(() => {
        // Assume 160 segundos por questão para um total aproximado se não especificado
        const totalDurationForSimulado = currentSimuladoData?.totalDurationInSeconds || (allSimuladoQuestions.length) * 160;
        const timeRemaining = Math.max(0, totalDurationForSimulado - totalElapsedTime);
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = Math.floor((timeRemaining % 3600) % 60); // Cálculo corrigido para segundos
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [currentSimuladoData, totalElapsedTime, allSimuladoQuestions.length]);


    // Mostra o Modal de Estatísticas
    const handleShowStatisticsModal = useCallback(async (attemptId) => {
        if (!db || !userId) {
            alertUser("Usuário não autenticado. Não é possível carregar estatísticas.");
            return;
        }
        try {
            // Busca o documento do relatório de desempenho no Firestore
            const performanceReportDocRef = doc(db, `artifacts/${appId}/users/${userId}/performanceReports`, attemptId);
            const docSnap = await getDoc(performanceReportDocRef);

            if (docSnap.exists()) {
                setStatsModalAttempt(docSnap.data()); // Define os dados do relatório
                setShowStatsModal(true); // Exibe o modal de estatísticas
            } else {
                alertUser("Relatório de desempenho não encontrado para esta tentativa.");
            }
        }
        catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
            alertUser("Erro ao carregar estatísticas. Por favor, tente novamente.");
        }
    }, [alertUser, db, userId, appId]);

    // Efeito para gerenciar o cronômetro total do simulado
    useEffect(() => {
        console.log("useEffect [isAuthReady, userId, db]: Disparado.");
        // O cronômetro só roda se o usuário estiver autenticado, não estiver em modo de revisão,
        // houver uma tentativa de simulado ativa e os dados do Firebase estiverem prontos.
        if (isAuthReady && !isReviewMode && currentSimulatedAttemptId && db && userId) {
            if (!isTimerRunningRef.current) {
                totalTimerIntervalRef.current = setInterval(() => {
                    setTotalElapsedTime(prevTime => {
                        const newTime = prevTime + 1;
                        // Calcula a duração total do simulado (ou usa 160s por questão como padrão)
                        const totalDurationForSimulado = currentSimuladoData?.totalDurationInSeconds || (allSimuladoQuestions.length) * 160;
                        
                        // Verifica se o tempo acabou
                        if (newTime >= totalDurationForSimulado && totalDurationForSimulado > 0) {
                            // Se o tempo acabar, finaliza o simulado automaticamente
                            if (isTimerRunningRef.current) { // Verifica se o temporizador ainda está rodando para evitar múltiplas chamadas
                                clearInterval(totalTimerIntervalRef.current);
                                totalTimerIntervalRef.current = null;
                                isTimerRunningRef.current = false;
                                alertUser("O tempo do simulado acabou! O simulado será finalizado automaticamente.", 'alert', () => handleReturnToActivities());
                            }
                            return newTime;
                        }
                        return newTime;
                    });
                }, 1000); // Atualiza a cada segundo
                isTimerRunningRef.current = true;
            }
        } else {
            // Se as condições não forem atendidas, limpa o temporizador
            if (isTimerRunningRef.current) {
                clearInterval(totalTimerIntervalRef.current);
                totalTimerIntervalRef.current = null;
                isTimerRunningRef.current = false;
            }
        };
    }, [isAuthReady, isReviewMode, currentSimulatedAttemptId, db, userId, totalTimerIntervalRef, isTimerRunningRef, alertUser, handleReturnToActivities, currentSimuladoData, allSimuladoQuestions.length]);


    // Carrega questões de erro do Firestore
    const loadErrorQuestions = useCallback(() => { // Removed async/await as it's not needed for just setting state
        if (!db || !userId || !isAuthReady) {
            setErrorQuestions(new Set());
            return;
        }
        try {
            // Use onSnapshot for real-time updates to error questions
            const errorQuestionsRef = collection(db, `artifacts/${appId}/users/${userId}/errorQuestionsDetails`);
            const q = query(errorQuestionsRef);
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const loadedErrorQuestionIds = new Set();
                querySnapshot.forEach(docSnap => {
                    loadedErrorQuestionIds.add(docSnap.id);
                });
                setErrorQuestions(loadedErrorQuestionIds);
            }, (error) => {
                console.error("Erro ao carregar caderno de erros em tempo real:", error);
                alertUser("Erro ao carregar seu caderno de erros. Por favor, tente novamente.");
            });

            return unsubscribe; // Retorna a função de unsubscribe para limpeza
        }
        catch (error) {
            console.error("Erro ao configurar listener do caderno de erros:", error);
            alertUser("Erro ao carregar seu caderno de erros. Por favor, tente novamente.");
        }
    }, [db, userId, isAuthReady, appId, alertUser]);


    // NOVO: Função para carregar TODAS as questões do simulado
    const loadAllSimuladoQuestions = useCallback(async (attemptId, reviewMode = false, passedSimuladoData = null) => {
        setIsLoadingQuestions(true); // Ativa o spinner de carregamento
        try {
            // 1. Busca os dados da tentativa do simulado
            const attemptDocRef = doc(db, `artifacts/${appId}/users/${userId}/simulatedAttempts`, attemptId);
            const docSnap = await getDoc(attemptDocRef);
            if (!docSnap.exists()) {
                alertUser("Dados do simulado não encontrados.");
                navigate(onReturnToSimuladosPage); // Usa navigate aqui também
                return;
            }
            const currentAttemptData = docSnap.data();

            // 2. Busca os dados do simulado pai
            const parentSimuladoId = currentAttemptData?.simuladoId;
            if (!parentSimuladoId || typeof parentSimuladoId !== 'string' || parentSimuladoId.trim() === '') {
                alertUser("Dados do simulado estão incompletos ou inválidos: ID do simulado pai ausente.");
                navigate(onReturnToSimuladosPage); // Usa navigate aqui também
                return;
            }
            let simuladoDataToUse = passedSimuladoData;
            if (!simuladoDataToUse || simuladoDataToUse.id !== parentSimuladoId) {
                // Se os dados do simulado pai não foram passados ou não correspondem, tenta buscar
                // Verifica se é um simulado competitivo (ID é uma data) ou um simulado normal
                let simuladoDocRef;
                let isWeeklySimulado = false; // Flag para identificar simulado semanal
                if (parentSimuladoId.match(/^\d{4}-\d{2}-\d{2}$/)) { // Regex simples para YYYY-MM-DD
                    simuladoDocRef = doc(db, `artifacts/${appId}/public/data/simulado_semanal`, parentSimuladoId);
                    isWeeklySimulado = true; // Define a flag
                } else {
                    simuladoDocRef = doc(db, `artifacts/${appId}/users/${userId}/simulados`, parentSimuladoId);
                }
                const simuladoSnap = await getDoc(simuladoDocRef);
                if (simuladoSnap.exists()) {
                    simuladoDataToUse = { id: simuladoSnap.id, ...simuladoSnap.data() };
                    if (isWeeklySimulado) {
                        simuladoDataToUse.type = 'semanal'; // Adiciona o campo 'type' para simulados semanais
                    }
                } else {
                    alertUser("Dados do simulado pai não encontrados.");
                    navigate(onReturnToSimuladosPage); // Usa navigate aqui também
                    return;
                }
            }
            setCurrentSimuladoData(simuladoDataToUse);

            // 3. Obtém a ordem das questões do documento da tentativa
            const questionOrder = currentAttemptData.questionOrder || [];
            if (questionOrder.length === 0) {
                alertUser(
                    "Não foi possível carregar as questões. O simulado pode estar incompleto. Por favor, verifique os dados no Firestore para esta tentativa ou inicie um novo simulado.",
                    'alert',
                    () => navigate(onReturnToSimuladosPage) // Usa navigate aqui também
                );
                return;
            }

            // 4. Busca TODAS as questões completas usando o 'in' query
            const questionsColRef = collection(db, `artifacts/${appId}/public/data/questions`);
            const fetchedQuestionsMap = new Map();
            const chunkSize = 10; // Limite do 'in' query do Firestore

            for (let i = 0; i < questionOrder.length; i += chunkSize) {
                const chunk = questionOrder.slice(i, i + chunkSize);
                if (chunk.length > 0) {
                    const q = query(questionsColRef, where(documentId(), 'in', chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        fetchedQuestionsMap.set(doc.id, { id: doc.id, ...doc.data() });
                    });
                }
            }

            // 5. Reconstroi o array ordenado de questões completas
            const orderedQuestions = questionOrder.map(id => fetchedQuestionsMap.get(id)).filter(Boolean);

            if (orderedQuestions.length === 0) {
                alertUser("Erro: Nenhuma questão encontrada para este simulado após o carregamento.");
                navigate(onReturnToSimuladosPage); // Usa navigate aqui também
                return;
            }

            setAllSimuladoQuestions(orderedQuestions); // Armazena as questões completas
            setUserAnswers(currentAttemptData.userAnswers || {});
            setQuestionReviewStatus(new Set(currentAttemptData.markedForReview || []));
            setTotalElapsedTime(currentAttemptData.timeTaken || 0);
            console.log("loadAllSimuladoQuestions: Setting currentAbsoluteQuestionIndex to initialQuestionIndex (", initialQuestionIndex, ") or 0.");
            setCurrentAbsoluteQuestionIndex(initialQuestionIndex || 0);
            setCurrentSimulatedAttemptId(attemptId);
            setIsReviewMode(reviewMode);

            // Define a visibilidade inicial dos comentários em modo de revisão
            // Por padrão, os comentários estarão recolhidos (false)
            setQuestionCommentVisibility({}); // Inicializa como objeto vazio, todos os comentários ocultos

            // Atualiza as refs para evitar recarregamentos desnecessários
            currentSimulatedAttemptIdStateRef.current = attemptId;
            isReviewModeStateRef.current = reviewMode;
            currentSimuladoDataStateRef.current = simuladoDataToUse;

        } catch (error) {
            console.error("Erro ao carregar todas as questões do simulado:", error);
            alertUser("Erro ao carregar questões do simulado. Por favor, tente novamente.");
            navigate(onReturnToSimuladosPage); // Usa navigate aqui também
        } finally {
            setIsLoadingQuestions(false); // Desativa o spinner de carregamento
        }
    }, [db, userId, appId, alertUser, onReturnToSimuladosPage, initialQuestionIndex, navigate]);


    // Ref para controlar se o índice inicial já foi definido
    const initialIndexSetRef = useRef(false);

    // Efeito de carregamento inicial para a tentativa de simulado
    useEffect(() => {
        console.log("SimuladoExecutePage: useEffect de carregamento inicial disparado.");
        if (isAuthReady && userId && db) {
            if (initialViewStatsMode) { // Se o modo de estatísticas for ativado
                handleShowStatisticsModal(initialSimulatedAttemptId);
            } else if (initialSimulatedAttemptId && (
                initialSimulatedAttemptId !== currentSimulatedAttemptIdStateRef.current ||
                initialIsReviewMode !== isReviewModeStateRef.current ||
                !currentSimuladoDataStateRef.current // Garante que os dados do simulado também estejam presentes
            )) {
                loadAllSimuladoQuestions(initialSimulatedAttemptId, initialIsReviewMode, initialSimuladoData);
            } else if (!initialSimulatedAttemptId && !initialViewStatsMode) {
                // Se não há ID de tentativa inicial e não é modo de estatísticas, significa que não há simulado para carregar.
                setIsLoadingQuestions(false);
            }

            const unsubscribe = loadErrorQuestions(); // Carrega o caderno de erros ao iniciar e se inscreve em updates
            return () => {
                if (unsubscribe) {
                    unsubscribe(); // Limpa o listener ao desmontar
                }
            };
        } else if (!isAuthReady) {
            // Se a autenticação não está pronta, desativa o loading inicial
            setIsLoadingQuestions(false);
        }

        // Limpa o temporizador ao desmontar o componente
        return () => {
            if (totalTimerIntervalRef.current) {
                clearInterval(totalTimerIntervalRef.current);
                totalTimerIntervalRef.current = null;
                isTimerRunningRef.current = false;
            }
        };
    }, [
        isAuthReady, userId, initialSimulatedAttemptId, initialIsReviewMode, initialSimuladoData, db, appId,
        loadAllSimuladoQuestions, loadErrorQuestions, alertUser, onReturnToSimuladosPage, initialViewStatsMode, handleShowStatisticsModal
    ]);

    // MODIFIED useEffect: Garante que o índice da questão seja 0 APENAS na carga inicial das questões.
    // Ele não deve ser reativado por mudanças subsequentes em currentAbsoluteQuestionIndex.
    useEffect(() => {
        console.log("useEffect [allSimuladoQuestions] para reset de índice disparado.");
        if (allSimuladoQuestions.length > 0 && !initialIndexSetRef.current) {
            console.log("Setting currentAbsoluteQuestionIndex to 0 on initial questions load.");
            setCurrentAbsoluteQuestionIndex(0);
            initialIndexSetRef.current = true; // Marca que o índice inicial já foi definido
        }
    }, [allSimuladoQuestions]); // Depende apenas de allSimuladoQuestions


    // Lida com a seleção de resposta do usuário
    const handleAnswerSelection = useCallback(async (questionId, selectedAnswer) => {
        if (isReviewMode) return; // Não permite alterar respostas em modo de revisão

        // Atualiza o estado local imediatamente com a nova resposta
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                selectedAnswer: selectedAnswer,
            }
        }));
    }, [isReviewMode]);

    // Lida com a atualização do status 'riscado' nas alternativas
    const handleUpdateRiscadoAlternatives = useCallback((questionId, updatedRiscado) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...(prev[questionId] || {}),
                riscadoAlternatives: updatedRiscado,
            }
        }));
    }, []);

    // Alterna a visibilidade do comentário para uma questão específica
    const handleToggleComment = useCallback((questionId) => {
        setQuestionCommentVisibility(prev => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    }, []);

    // Alterna a questão no caderno de erros (adiciona ou remove)
    const handleToggleErrorQuestion = useCallback(async (question, addOrRemove) => {
        if (!db || !userId) {
            alertUser("Usuário não autenticado. Não é possível adicionar/remover questão do caderno de erros.");
            return;
        }
        // Referência ao documento da questão no caderno de erros
        const errorDetailsDocRef = doc(db, `artifacts/${appId}/users/${userId}/errorQuestionsDetails`, question.id);

        // Obtém a resposta do usuário para esta questão (para salvar junto com a questão no caderno de erros)
        const userAnswerData = userAnswers[question.id];
        const selectedAnswer = userAnswerData?.selectedAnswer || null;

        try {
            if (addOrRemove) {
                // Adiciona a questão ao caderno de erros, incluindo todos os campos da questão original e a resposta do usuário
                await setDoc(errorDetailsDocRef, {
                    ...question,
                    userAnswer: selectedAnswer
                });
                // Não precisa mais atualizar o estado local diretamente aqui, o onSnapshot fará isso
                alertUser("Questão adicionada ao caderno de erros!");
            } else {
                // Remove a questão do caderno de erros
                await deleteDoc(errorDetailsDocRef);
                // Não precisa mais atualizar o estado local diretamente aqui, o onSnapshot fará isso
                alertUser("Questão removida do caderno de erros!");
            }
        }
        catch (error) {
            console.error(`Erro ao ${addOrRemove ? 'adicionar' : 'remover'} questão do caderno de erros:`, error);
            alertUser(`Erro ao ${addOrRemove ? 'adicionar' : 'remover'} questão do caderno de erros. Por favor, tente novamente.`);
        }
    }, [db, userId, appId, alertUser, userAnswers]); // Adiciona userAnswers como dependência

    // Alterna o status de "marcar para revisão"
    const handleToggleReviewMark = useCallback(async (questionId) => {
        if (!db || !userId || !currentSimulatedAttemptId) {
            alertUser("Autenticação ou dados da tentativa ausentes. Não é possível marcar para revisão.");
            return;
        }

        setQuestionReviewStatus(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            // Persiste o novo status no Firestore imediatamente
            const simulatedAttemptDocRef = doc(db, `artifacts/${appId}/users/${userId}/simulatedAttempts`, currentSimulatedAttemptId);
            updateDoc(simulatedAttemptDocRef, {
                markedForReview: Array.from(newSet) // Converte Set para Array para o Firestore
            })
            .catch(error => {
                console.error("Erro ao salvar status de revisão:", error);
                alertUser("Erro ao salvar o status de revisão. Por favor, tente novamente.");
            });
            return newSet;
        });
    }, [db, userId, appId, currentSimulatedAttemptId, alertUser]);


    // Navega entre as questões usando o índice absoluto
    const navigateQuestion = useCallback((direction) => {
        console.log(`navigateQuestion called with direction: ${direction}`);
        console.log(`Current index before: ${currentAbsoluteQuestionIndex}, Total questions: ${allSimuladoQuestions.length}`);

        if (allSimuladoQuestions.length === 0) {
            console.log("No questions to navigate.");
            return;
        }

        let newAbsoluteIndex = currentAbsoluteQuestionIndex;
        const totalQuestionsInSimulado = allSimuladoQuestions.length;

        if (direction === 'prev') {
            newAbsoluteIndex = Math.max(0, currentAbsoluteQuestionIndex - 1);
        } else if (direction === 'next') {
            newAbsoluteIndex = Math.min(totalQuestionsInSimulado - 1, currentAbsoluteQuestionIndex + 1);
        }

        // Se o índice não mudou (ex: já está na primeira/última), não faz nada
        if (newAbsoluteIndex === currentAbsoluteQuestionIndex) {
            console.log("Index did not change, already at boundary.");
            return;
        }

        console.log(`Setting newAbsoluteIndex to: ${newAbsoluteIndex}`);
        setCurrentAbsoluteQuestionIndex(newAbsoluteIndex);
    }, [currentAbsoluteQuestionIndex, allSimuladoQuestions.length]);


    const handleQuestionSelectFromMap = useCallback((targetAbsoluteIndex) => {
        if (allSimuladoQuestions.length === 0 || targetAbsoluteIndex < 0 || targetAbsoluteIndex >= allSimuladoQuestions.length) {
            return;
        }
        setCurrentAbsoluteQuestionIndex(targetAbsoluteIndex);
    }, [allSimuladoQuestions.length]);


    // Funções de acessibilidade
    const increaseFontSize = useCallback(() => {
        setFontSize(prevSize => Math.min(prevSize + 2, 24));
    }, []);

    const decreaseFontSize = useCallback(() => {
        setFontSize(prevSize => Math.max(prevSize - 2, 12));
    }, []);

    const toggleDarkMode = useCallback(() => {
        setDarkMode(prevMode => {
            if (!prevMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return !prevMode;
        });
    }, []);

    const handlePrint = useCallback(async () => {
        if (!db || !userId || !currentSimuladoData || allSimuladoQuestions.length === 0) {
            alertUser("Dados insuficientes para impressão. Por favor, carregue o simulado primeiro.");
            return;
        }

        const userPhoto = auth.currentUser?.photoURL || '';
        const userName = auth.currentUser?.displayName || 'Usuário';

        let printContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simulado - ${currentSimuladoData?.name || 'Questões'}</title>
                <style>
                    @page {
                        margin: 0.5in;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Inter', sans-serif;
                        color: #333;
                        position: relative;
                        padding: 20px;
                    }
                    .header-print {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #ccc;
                    }
                    .header-print h1 {
                        font-size: 1.8em;
                        margin: 0;
                        color: #333;
                    }
                    .user-profile-print {
                        display: flex;
                        align-items: center;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        max-width: 50%;
                    }
                    .user-profile-print img {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                        margin-right: 10px;
                        border: 1px solid #eee;
                        flex-shrink: 0;
                    }
                    .user-profile-print span {
                        font-weight: bold;
                        color: #555;
                        flex-grow: 1;
                        min-width: 0;
                    }
                    .question-container {
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 1px dashed #eee;
                        page-break-inside: avoid;
                    }
                    .question-title {
                        font-weight: bold;
                        font-size: 1.1em;
                        margin-bottom: 10px;
                    }
                    .alternatives-list {
                        list-style: none;
                        padding: 0;
                        margin-top: 5px;
                    }
                    .alternative-item {
                        margin-bottom: 5px;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 10px auto;
                    }
                    .answer-key {
                        margin-top: 50px;
                        border-top: 2px solid #333;
                        padding-top: 20px;
                    }
                    .answer-key-title {
                        font-size: 1.5em;
                        font-weight: bold;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .answer-item {
                        margin-bottom: 5px;
                    }

                    .watermark {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 0;
                        background-image: url('https://res.cloudinary.com/dginw4pny/image/upload/v1748647843/BrainMed_gqablp.png');
                        background-repeat: no-repeat;
                        background-position: center center;
                        background-size: 80%;
                        opacity: 0.1;
                    }

                    @media print {
                        .watermark {
                            -webkit-print-color-adjust: exact;
                            color-adjust: exact;
                            opacity: 0.2 !important;
                            background-size: 40% !important;
                            transform: rotate(-45deg);
                            transform-origin: center center;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="watermark"></div>
                <div class="header-print">
                    <h1>Simulado: ${currentSimuladoData?.name || ''}</h1>
                    ${userPhoto ? `
                        <div class="user-profile-print">
                            <img src="${userPhoto}" alt="" onerror="this.src='https://placehold.co/40x40/cccccc/ffffff?text=User'" />
                            <span>${userName}</span>
                        </div>
                    ` : ''}
                </div>
        `;

        allSimuladoQuestions.forEach((q, index) => {
            printContent += `
                <div class="question-container">
                    <p class="question-title">Questão ${index + 1}:</p>
                    <p>${q.question}</p>
            `;
            if (q.questionImage) {
                printContent += `<img src="${q.questionImage}" alt="" />`;
            }
            printContent += `<ul class="alternatives-list">`;
            q.alternatives.forEach((alt, altIndex) => {
                const letter = String.fromCharCode(65 + altIndex);
                printContent += `<li class="alternative-item">${letter}) ${alt}</li>`;
            });
            printContent += `</ul></div>`;
        });

        printContent += `
            <div class="answer-key">
                <h2 class="answer-key-title">Gabarito</h2>
                <ul>
        `;
        allSimuladoQuestions.forEach((q, index) => {
            printContent += `<li class="answer-item">Questão ${index + 1}: <strong>${q.correctAnswer}</strong></li>`;
        });
        printContent += `</ul></div></body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else {
            alertUser("Não foi possível abrir a janela de impressão. Por favor, verifique as configurações de pop-up do seu navegador.");
        }
    }, [allSimuladoQuestions, currentSimuladoData, alertUser, auth, db, userId]);

    // Memoiza a questão atual para renderização eficiente
    const currentQuestion = useMemo(() => {
        console.log("currentQuestion useMemo: index", currentAbsoluteQuestionIndex, "total questions", allSimuladoQuestions.length);
        if (allSimuladoQuestions.length === 0) {
            return null;
        }
        return allSimuladoQuestions[currentAbsoluteQuestionIndex];
    }, [currentAbsoluteQuestionIndex, allSimuladoQuestions]);

    // Determina se é a última questão
    const isLastQuestion = useMemo(() => {
        return currentAbsoluteQuestionIndex === allSimuladoQuestions.length - 1;
    }, [currentAbsoluteQuestionIndex, allSimuladoQuestions.length]);


    const bgColorClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
    const textColorClass = darkMode ? 'text-gray-200' : 'text-gray-900';
    const mainContainerBg = darkMode ? 'bg-gray-800' : 'bg-white';
    const headerBgColor = 'bg-blue-600';

    // Pré-renderização: Exibe spinner de carregamento ou mensagem de erro
    if (isLoadingQuestions) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <LoadingSpinner />
            </div>
        );
    }

    if (allSimuladoQuestions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
                <AlertModal
                    message="Nenhuma questão encontrada para este simulado. Por favor, verifique os dados ou tente iniciar um novo simulado."
                    type="alert"
                    onClose={handleCloseStatsAndReturnToActivities} // Certifica-se de que o modal de alerta também usa a navegação correta
                />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${bgColorClass} ${textColorClass} font-inter transition-colors duration-300 pt-24 pb-8`}>
            {/* Cabeçalho */}
            <div className={`fixed top-0 left-0 right-0 ${headerBgColor} shadow-lg p-4 flex items-center justify-between z-30 rounded-b-lg`}>
                {/* Seção Esquerda: Botão de Fechar */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleReturnToActivities}
                        className="text-red-500 hover:text-red-700 bg-white p-2 rounded-full shadow-md transition duration-200"
                        title="Voltar para Simulados"
                    >
                        <X className="h-7 w-7" strokeWidth={3} />
                    </button>
                </div>

                {/* Seção Direita: Ferramentas */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowAccessibilityPopup(prev => !prev)}
                        className="text-white hover:text-blue-100 transition duration-200 py-2 px-3 rounded-md"
                        title="Ferramentas de Acessibilidade"
                    >
                        <Settings className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Popup de Acessibilidade */}
            <AnimatePresence>
                {showAccessibilityPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-transparent flex justify-end items-start pt-16 pr-4 z-40"
                        onClick={(e) => {
                            if (accessibilityPopupRef.current && !accessibilityPopupRef.current.contains(e.target)) {
                                setShowAccessibilityPopup(false);
                            }
                        }}
                    >
                        <div ref={accessibilityPopupRef} className={`${mainContainerBg} p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-gray-900`}>
                            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Controlo de Fonte:</h3>
                            <div className="flex space-x-2 mb-4">
                                <button
                                    onClick={decreaseFontSize}
                                    className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    A-
                                </button>
                                <button
                                    onClick={increaseFontSize}
                                    className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    A+
                                </button>
                            </div>
                            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Modo Escuro:</h3>
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={darkMode} onChange={toggleDarkMode} />
                                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                    <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform transform" style={{ transform: darkMode ? 'translateX(100%)' : 'translateX(0)' }}></div>
                                </div>
                                <div className={`ml-3 font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {darkMode ? 'Ativado' : 'Desativado'}
                                </div>
                            </label>
                            <div className="mt-4">
                                <button
                                    onClick={handlePrint}
                                    className="bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-3 py-1 rounded-md hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors w-full"
                                >
                                    Imprimir Questões
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wrapper do Conteúdo Principal - Condicionalmente renderizado */}
            {!showStatsModal && (
                <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 flex flex-col items-center">
                    {/* Contêiner do Cartão da Questão */}
                    <QuestionCardWrapper
                        darkMode={darkMode}
                        getRemainingTimeDisplay={getRemainingTimeDisplay}
                        currentAbsoluteQuestionIndex={currentAbsoluteQuestionIndex}
                        totalQuestions={allSimuladoQuestions.length}
                        totalElapsedTime={totalElapsedTime} // Pass totalElapsedTime to determine timer color
                        currentSimuladoData={currentSimuladoData} // Pass simulado data for total duration
                    >
                        {currentQuestion ? (
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.3 }}
                            >
                                <QuestionDisplay
                                    question={currentQuestion}
                                    questionIndex={currentAbsoluteQuestionIndex} // Passa o índice ABSOLUTO
                                    totalQuestions={allSimuladoQuestions.length} // Passa o total REAL de questoes
                                    userAnswer={userAnswers[currentQuestion.id]}
                                    isReviewMode={isReviewMode}
                                    onAnswerChange={handleAnswerSelection}
                                    onToggleComment={handleToggleComment}
                                    isCommentVisible={questionCommentVisibility[currentQuestion.id]}
                                    onToggleErrorQuestion={handleToggleErrorQuestion}
                                    isErrorQuestion={errorQuestions.has(currentQuestion.id)}
                                    onImageClick={handleImageClick}
                                    currentFontSize={fontSize}
                                    darkMode={darkMode}
                                    onToggleReviewMark={handleToggleReviewMark}
                                    isMarkedForReview={questionReviewStatus.has(currentQuestion.id)}
                                    onUpdateRiscadoAlternatives={handleUpdateRiscadoAlternatives}
                                    areaIconsMap={AREA_ICONS} // Passa o mapa de ícones de área
                                />
                            </motion.div>
                        ) : (
                            // Mensagem de carregamento mais clara
                            <p className="no-questions-message text-center text-gray-600 text-lg">
                                Carregando questões...
                            </p>
                        )}
                        {/* Botões de Navegação (Voltar e Avançar) */}
                        <div className="absolute bottom-0 left-0 right-0 flex w-full">
                            <button
                                onClick={() => navigateQuestion('prev')}
                                className={`flex-1 py-8 flex items-center justify-center font-bold text-lg rounded-none shadow-lg transition duration-300 ease-in-out transform hover:scale-105
                                    ${currentAbsoluteQuestionIndex === 0
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                    }`}
                                disabled={currentAbsoluteQuestionIndex === 0}
                            >
                                <ChevronLeft className="h-6 w-6 mr-2" />
                                Voltar
                            </button>

                            <button
                                onClick={() => isLastQuestion ? handleReturnToActivities() : navigateQuestion('next')}
                                className={`flex-1 py-8 flex items-center justify-center font-bold text-lg rounded-none shadow-lg transition duration-300 ease-in-out transform hover:scale-105
                                    ${isLastQuestion
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                            >
                                {isLastQuestion
                                    ? (isReviewMode ? 'Finalizar Revisão' : 'Finalizar Simulado')
                                    : 'Avançar'}
                                <ChevronRight className="h-6 w-6 ml-2" />
                            </button>
                        </div>
                    </QuestionCardWrapper>

                    {/* Botão de Alternar Mapa de Questões */}
                    <button
                        onClick={() => setShowQuestionMap(prev => !prev)}
                        className={`mt-4 w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-center py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-bold
                            ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                    >
                        Mapa de Questões {showQuestionMap ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
                    </button>

                    {/* Mapa de Questões */}
                    <AnimatePresence>
                        {showQuestionMap && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto mt-4"
                                ref={questionMapRef}
                            >
                                <QuestionMap
                                    allSimuladoQuestions={allSimuladoQuestions} // Passa metadados completos
                                    userAnswers={userAnswers}
                                    currentAbsoluteQuestionIndex={currentAbsoluteQuestionIndex} // Passa indice ABSOLUTO
                                    onQuestionSelect={handleQuestionSelectFromMap} // Novo handler para selecao do mapa
                                    questionReviewStatus={questionReviewStatus}
                                    darkMode={darkMode}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Botão de Alternar Mapa de Área */}
                    <button
                        onClick={() => setShowAreaMap(prev => !prev)}
                        className={`mt-4 w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-center py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 font-bold
                            ${darkMode ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                    >
                        Progresso por Área {showAreaMap ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
                    </button>

                    {/* Mapa de Área */}
                    <AnimatePresence>
                        {showAreaMap && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto mt-4"
                                ref={areaMapRef}
                            >
                                <AreaMap
                                    simuladoData={currentSimuladoData}
                                    userAnswers={userAnswers}
                                    allSimuladoQuestions={allSimuladoQuestions} // Passa metadados completos
                                    darkMode={darkMode}
                                    currentAbsoluteQuestionIndex={currentAbsoluteQuestionIndex} // Passa indice ABSOLUTO
                                    onQuestionSelect={handleQuestionSelectFromMap} // Novo handler para selecao do mapa
                                    areaIconsMap={AREA_ICONS} // Passa o mapa de ícones de área para o AreaMap
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}


            {/* Modais */}
            {showStatsModal && (
                <StatisticsModal
                    performanceReport={statsModalAttempt}
                    onClose={handleCloseStatsAndReturnToActivities}
                />
            )}

            {showAlert && (
                <AlertModal
                    message={alertMessage}
                    type={alertType}
                    onClose={handleCloseAlert}
                    onConfirm={handleConfirmAlert}
                />
            )}

            {showImageModal && (
                <ZoomableImageModal
                    src={modalImageSrc}
                    onClose={handleCloseImageModal}
                />
            )}
        </div>
    );
}

export default SimuladoExecutePage;

