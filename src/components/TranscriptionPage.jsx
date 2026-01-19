import { useState } from 'react';
import { medicalTrainingData, enhanceTranscription, findMedicalInfo } from '../data/trainingUtils';

const Sidebar = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-50 overflow-y-auto">
        <div className="flex flex-col gap-6 px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>

          {/* Upgrade to Pro */}
          <article className="flex flex-col gap-2 rounded-3xl bg-blue-50 dark:bg-blue-950 p-4">
            <header className="pt-2 text-center text-[1.75rem] font-semibold leading-[2.125rem] text-gray-900 dark:text-white">
              Obtenha o <span className="inline-block">Documenta <span className="rounded-lg bg-orange-500 px-2 text-[1.375rem]/7 text-white">Pro</span></span>
            </header>
            <ul className="flex flex-col gap-2 px-4 py-6">
              <li className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M1.17226 14.2451C1.21395 13.8383 1.25341 13.4309 1.29787 13.0241C1.354 12.515 1.21561 12.0648 0.90327 11.6619C0.715975 11.4207 0.534238 11.175 0.359169 10.9249C-0.118794 10.2408 -0.11935 9.75447 0.355279 9.07142C0.505893 8.85523 0.657063 8.63737 0.827685 8.43729C1.27619 7.90986 1.37012 7.30574 1.27175 6.64159C1.21506 6.25922 1.1517 5.87518 1.19227 5.48225C1.23284 5.08543 1.4257 4.79532 1.75027 4.57801C1.95368 4.4424 2.1771 4.34792 2.39885 4.24955C2.59504 4.16229 2.79234 4.07726 2.99019 3.99389C3.46149 3.79604 3.79439 3.46202 3.99503 2.99239C4.12841 2.68005 4.25846 2.36604 4.40574 2.06036C4.75532 1.33452 5.1766 1.10721 5.97747 1.19225C6.30871 1.22782 6.63995 1.25727 6.97119 1.29395C7.48027 1.35064 7.92767 1.20781 8.33449 0.900467C8.6335 0.674824 8.9275 0.442511 9.24485 0.241322C9.76505 -0.0882507 10.2791 -0.0788026 10.7849 0.260774C11.0611 0.446402 11.3379 0.634808 11.593 0.847669C12.1082 1.27839 12.6945 1.35953 13.3342 1.27061C13.7177 1.21726 14.1006 1.15168 14.4936 1.18558C14.9343 1.22393 15.2427 1.4479 15.4639 1.81527C15.6723 2.16151 15.813 2.53944 15.9664 2.91014C16.1853 3.43923 16.5488 3.80938 17.0801 4.02502C17.4075 4.15785 17.7348 4.29512 18.0477 4.45796C18.6674 4.78087 18.8864 5.21548 18.813 5.91019C18.7741 6.27589 18.7385 6.64159 18.7013 7.00729C18.653 7.48636 18.7841 7.91208 19.0748 8.29334C19.2515 8.5251 19.4244 8.76019 19.5944 8.99639C20.1363 9.74946 20.1369 10.2369 19.5978 10.9866C19.4522 11.1895 19.311 11.3973 19.1498 11.5874C18.7158 12.0993 18.6329 12.6895 18.7269 13.3281C18.7674 13.6026 18.7975 13.8788 18.8186 14.1551C18.8664 14.7692 18.6391 15.2422 18.0722 15.5184C17.742 15.679 17.4075 15.8313 17.0679 15.9702C16.5516 16.1814 16.192 16.5382 15.9791 17.0534C15.8419 17.3863 15.7018 17.7198 15.5373 18.0394C15.2188 18.6574 14.7803 18.8786 14.0856 18.8047C13.706 18.7646 13.3264 18.7268 12.9468 18.6913C12.49 18.6485 12.0843 18.7813 11.7191 19.0542C11.4524 19.2537 11.1873 19.4555 10.9138 19.6455C10.2486 20.1074 9.76338 20.1085 9.09423 19.6489C8.86581 19.4921 8.63739 19.331 8.4262 19.152C7.90933 18.7141 7.31521 18.6212 6.66773 18.7185C6.39374 18.7596 6.11696 18.7896 5.84075 18.8102C5.24663 18.8547 4.78534 18.6435 4.49467 18.101C4.32071 17.7759 4.18121 17.4363 4.04338 17.0962C3.81996 16.5427 3.43759 16.1658 2.88404 15.9441C2.55002 15.8102 2.21656 15.6729 1.8981 15.5017C1.39402 15.231 1.15226 14.8142 1.17282 14.2423L1.17226 14.2451ZM14.7564 7.79871C14.7631 7.56139 14.6947 7.34686 14.5564 7.15512C14.144 6.58101 13.3681 6.53933 12.8374 7.06842C11.6324 8.26889 10.4298 9.47158 9.23095 10.6782C9.11869 10.791 9.05755 10.8021 8.93973 10.682C8.34227 10.0724 7.73815 9.4688 7.12902 8.87023C6.66662 8.41561 5.98136 8.41895 5.54507 8.86523C5.12658 9.29373 5.13436 9.97344 5.57675 10.4192C6.48099 11.3312 7.38968 12.2388 8.30115 13.1436C8.75799 13.5971 9.39213 13.611 9.84508 13.1602C11.3818 11.6335 12.9107 10.0996 14.4408 8.56678C14.6497 8.35726 14.7609 8.09993 14.7564 7.79926V7.79871Z" className="fill-gray-900 dark:fill-white"/>
                  <path d="M14.7572 7.7979C14.761 8.09858 14.6504 8.3559 14.4409 8.56543C12.9109 10.0988 11.382 11.6327 9.84525 13.1589C9.39174 13.6091 8.75816 13.5957 8.30131 13.1422C7.38985 12.2374 6.48172 11.3293 5.57692 10.4178C5.13508 9.97208 5.12675 9.29182 5.54524 8.86387C5.98152 8.41759 6.66679 8.41426 7.12919 8.86888C7.73832 9.46744 8.34244 10.071 8.93989 10.6807C9.05772 10.8013 9.11885 10.7896 9.23112 10.6768C10.4299 9.47022 11.6326 8.26753 12.8375 7.06706C13.3683 6.53797 14.1441 6.57965 14.5565 7.15376C14.6944 7.34551 14.7633 7.56003 14.7566 7.79735L14.7572 7.7979Z" className="fill-white dark:fill-slate-900"/>
                </svg>
                <span className="text-base font-light leading-5 [&>strong]:font-semibold"><strong>Até 90 minutos</strong> de gravação</span>
              </li>
              <li className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M1.17226 14.2451C1.21395 13.8383 1.25341 13.4309 1.29787 13.0241C1.354 12.515 1.21561 12.0648 0.90327 11.6619C0.715975 11.4207 0.534238 11.175 0.359169 10.9249C-0.118794 10.2408 -0.11935 9.75447 0.355279 9.07142C0.505893 8.85523 0.657063 8.63737 0.827685 8.43729C1.27619 7.90986 1.37012 7.30574 1.27175 6.64159C1.21506 6.25922 1.1517 5.87518 1.19227 5.48225C1.23284 5.08543 1.4257 4.79532 1.75027 4.57801C1.95368 4.4424 2.1771 4.34792 2.39885 4.24955C2.59504 4.16229 2.79234 4.07726 2.99019 3.99389C3.46149 3.79604 3.79439 3.46202 3.99503 2.99239C4.12841 2.68005 4.25846 2.36604 4.40574 2.06036C4.75532 1.33452 5.1766 1.10721 5.97747 1.19225C6.30871 1.22782 6.63995 1.25727 6.97119 1.29395C7.48027 1.35064 7.92767 1.20781 8.33449 0.900467C8.6335 0.674824 8.9275 0.442511 9.24485 0.241322C9.76505 -0.0882507 10.2791 -0.0788026 10.7849 0.260774C11.0611 0.446402 11.3379 0.634808 11.593 0.847669C12.1082 1.27839 12.6945 1.35953 13.3342 1.27061C13.7177 1.21726 14.1006 1.15168 14.4936 1.18558C14.9343 1.22393 15.2427 1.4479 15.4639 1.81527C15.6723 2.16151 15.813 2.53944 15.9664 2.91014C16.1853 3.43923 16.5488 3.80938 17.0801 4.02502C17.4075 4.15785 17.7348 4.29512 18.0477 4.45796C18.6674 4.78087 18.8864 5.21548 18.813 5.91019C18.7741 6.27589 18.7385 6.64159 18.7013 7.00729C18.653 7.48636 18.7841 7.91208 19.0748 8.29334C19.2515 8.5251 19.4244 8.76019 19.5944 8.99639C20.1363 9.74946 20.1369 10.2369 19.5978 10.9866C19.4522 11.1895 19.311 11.3973 19.1498 11.5874C18.7158 12.0993 18.6329 12.6895 18.7269 13.3281C18.7674 13.6026 18.7975 13.8788 18.8186 14.1551C18.8664 14.7692 18.6391 15.2422 18.0722 15.5184C17.742 15.679 17.4075 15.8313 17.0679 15.9702C16.5516 16.1814 16.192 16.5382 15.9791 17.0534C15.8419 17.3863 15.7018 17.7198 15.5373 18.0394C15.2188 18.6574 14.7803 18.8786 14.0856 18.8047C13.706 18.7646 13.3264 18.7268 12.9468 18.6913C12.49 18.6485 12.0843 18.7813 11.7191 19.0542C11.4524 19.2537 11.1873 19.4555 10.9138 19.6455C10.2486 20.1074 9.76338 20.1085 9.09423 19.6489C8.86581 19.4921 8.63739 19.331 8.4262 19.152C7.90933 18.7141 7.31521 18.6212 6.66773 18.7185C6.39374 18.7596 6.11696 18.7896 5.84075 18.8102C5.24663 18.8547 4.78534 18.6435 4.49467 18.101C4.32071 17.7759 4.18121 17.4363 4.04338 17.0962C3.81996 16.5427 3.43759 16.1658 2.88404 15.9441C2.55002 15.8102 2.21656 15.6729 1.8981 15.5017C1.39402 15.231 1.15226 14.8142 1.17282 14.2423L1.17226 14.2451ZM14.7564 7.79871C14.7631 7.56139 14.6947 7.34686 14.5564 7.15512C14.144 6.58101 13.3681 6.53933 12.8374 7.06842C11.6324 8.26889 10.4298 9.47158 9.23095 10.6782C9.11869 10.791 9.05755 10.8021 8.93973 10.682C8.34227 10.0724 7.73815 9.4688 7.12902 8.87023C6.66662 8.41561 5.98136 8.41895 5.54507 8.86523C5.12658 9.29373 5.13436 9.97344 5.57675 10.4192C6.48099 11.3312 7.38968 12.2388 8.30115 13.1436C8.75799 13.5971 9.39213 13.611 9.84508 13.1602C11.3818 11.6335 12.9107 10.0996 14.4408 8.56678C14.6497 8.35726 14.7609 8.09993 14.7564 7.79926V7.79871Z" className="fill-gray-900 dark:fill-white"/>
                  <path d="M14.7572 7.7979C14.761 8.09858 14.6504 8.3559 14.4409 8.56543C12.9109 10.0988 11.382 11.6327 9.84525 13.1589C9.39174 13.6091 8.75816 13.5957 8.30131 13.1422C7.38985 12.2374 6.48172 11.3293 5.57692 10.4178C5.13508 9.97208 5.12675 9.29182 5.54524 8.86387C5.98152 8.41759 6.66679 8.41426 7.12919 8.86888C7.73832 9.46744 8.34244 10.071 8.93989 10.6807C9.05772 10.8013 9.11885 10.7896 9.23112 10.6768C10.4299 9.47022 11.6326 8.26753 12.8375 7.06706C13.3683 6.53797 14.1441 6.57965 14.5565 7.15376C14.6944 7.34551 14.7633 7.56003 14.7566 7.79735L14.7572 7.7979Z" className="fill-white dark:fill-slate-900"/>
                </svg>
                <span className="text-base font-light leading-5 [&>strong]:font-semibold"><strong>Ilimitado</strong> número de gravações</span>
              </li>
              <li className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                  <path d="M1.17226 14.2451C1.21395 13.8383 1.25341 13.4309 1.29787 13.0241C1.354 12.515 1.21561 12.0648 0.90327 11.6619C0.715975 11.4207 0.534238 11.175 0.359169 10.9249C-0.118794 10.2408 -0.11935 9.75447 0.355279 9.07142C0.505893 8.85523 0.657063 8.63737 0.827685 8.43729C1.27619 7.90986 1.37012 7.30574 1.27175 6.64159C1.21506 6.25922 1.1517 5.87518 1.19227 5.48225C1.23284 5.08543 1.4257 4.79532 1.75027 4.57801C1.95368 4.4424 2.1771 4.34792 2.39885 4.24955C2.59504 4.16229 2.79234 4.07726 2.99019 3.99389C3.46149 3.79604 3.79439 3.46202 3.99503 2.99239C4.12841 2.68005 4.25846 2.36604 4.40574 2.06036C4.75532 1.33452 5.1766 1.10721 5.97747 1.19225C6.30871 1.22782 6.63995 1.25727 6.97119 1.29395C7.48027 1.35064 7.92767 1.20781 8.33449 0.900467C8.6335 0.674824 8.9275 0.442511 9.24485 0.241322C9.76505 -0.0882507 10.2791 -0.0788026 10.7849 0.260774C11.0611 0.446402 11.3379 0.634808 11.593 0.847669C12.1082 1.27839 12.6945 1.35953 13.3342 1.27061C13.7177 1.21726 14.1006 1.15168 14.4936 1.18558C14.9343 1.22393 15.2427 1.4479 15.4639 1.81527C15.6723 2.16151 15.813 2.53944 15.9664 2.91014C16.1853 3.43923 16.5488 3.80938 17.0801 4.02502C17.4075 4.15785 17.7348 4.29512 18.0477 4.45796C18.6674 4.78087 18.8864 5.21548 18.813 5.91019C18.7741 6.27589 18.7385 6.64159 18.7013 7.00729C18.653 7.48636 18.7841 7.91208 19.0748 8.29334C19.2515 8.5251 19.4244 8.76019 19.5944 8.99639C20.1363 9.74946 20.1369 10.2369 19.5978 10.9866C19.4522 11.1895 19.311 11.3973 19.1498 11.5874C18.7158 12.0993 18.6329 12.6895 18.7269 13.3281C18.7674 13.6026 18.7975 13.8788 18.8186 14.1551C18.8664 14.7692 18.6391 15.2422 18.0722 15.5184C17.742 15.679 17.4075 15.8313 17.0679 15.9702C16.5516 16.1814 16.192 16.5382 15.9791 17.0534C15.8419 17.3863 15.7018 17.7198 15.5373 18.0394C15.2188 18.6574 14.7803 18.8786 14.0856 18.8047C13.706 18.7646 13.3264 18.7268 12.9468 18.6913C12.49 18.6485 12.0843 18.7813 11.7191 19.0542C11.4524 19.2537 11.1873 19.4555 10.9138 19.6455C10.2486 20.1074 9.76338 20.1085 9.09423 19.6489C8.86581 19.4921 8.63739 19.331 8.4262 19.152C7.90933 18.7141 7.31521 18.6212 6.66773 18.7185C6.39374 18.7596 6.11696 18.7896 5.84075 18.8102C5.24663 18.8547 4.78534 18.6435 4.49467 18.101C4.32071 17.7759 4.18121 17.4363 4.04338 17.0962C3.81996 16.5427 3.43759 16.1658 2.88404 15.9441C2.55002 15.8102 2.21656 15.6729 1.8981 15.5017C1.39402 15.231 1.15226 14.8142 1.17282 14.2423L1.17226 14.2451ZM14.7564 7.79871C14.7631 7.56139 14.6947 7.34686 14.5564 7.15512C14.144 6.58101 13.3681 6.53933 12.8374 7.06842C11.6324 8.26889 10.4298 9.47158 9.23095 10.6782C9.11869 10.791 9.05755 10.8021 8.93973 10.682C8.34227 10.0724 7.73815 9.4688 7.12902 8.87023C6.66662 8.41561 5.98136 8.41895 5.54507 8.86523C5.12658 9.29373 5.13436 9.97344 5.57675 10.4192C6.48099 11.3312 7.38968 12.2388 8.30115 13.1436C8.75799 13.5971 9.39213 13.611 9.84508 13.1602C11.3818 11.6335 12.9107 10.0996 14.4408 8.56678C14.6497 8.35726 14.7609 8.09993 14.7564 7.79926V7.79871Z" className="fill-gray-900 dark:fill-white"/>
                  <path d="M14.7572 7.7979C14.761 8.09858 14.6504 8.3559 14.4409 8.56543C12.9109 10.0988 11.382 11.6327 9.84525 13.1589C9.39174 13.6091 8.75816 13.5957 8.30131 13.1422C7.38985 12.2374 6.48172 11.3293 5.57692 10.4178C5.13508 9.97208 5.12675 9.29182 5.54524 8.86387C5.98152 8.41759 6.66679 8.41426 7.12919 8.86888C7.73832 9.46744 8.34244 10.071 8.93989 10.6807C9.05772 10.8013 9.11885 10.7896 9.23112 10.6768C10.4299 9.47022 11.6326 8.26753 12.8375 7.06706C13.3683 6.53797 14.1441 6.57965 14.5565 7.15376C14.6944 7.34551 14.7633 7.56003 14.7566 7.79735L14.7572 7.7979Z" className="fill-white dark:fill-slate-900"/>
                </svg>
                <span className="text-base font-light leading-5 [&>strong]:font-semibold">Mais de <strong>25</strong> opções de reescrita</span>
              </li>
            </ul>
            <button className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl bg-orange-500 text-xl font-semibold leading-6 text-white transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-100">
              Faça upgrade para Pro
            </button>
          </article>
        </div>
      </div>
    </>
  );
};

const TranscriptionPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // Inicia com microfone desligado

  // Estado para controlar expansão das transcrições
  const [isTranscriptionsExpanded, setIsTranscriptionsExpanded] = useState(false);

  // Estado para controlar se uma transcrição foi carregada
  const [hasLoadedTranscription, setHasLoadedTranscription] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleTranscriptionChange = (text) => {
    setTranscriptionText(text);
  };

  // Função para carregar transcrição na área de edição
  const loadTranscriptionContent = (transcription) => {
    // Por enquanto, apenas marcamos que uma transcrição foi carregada
    // Em uma implementação futura, poderíamos integrar com um editor mais avançado
    setHasLoadedTranscription(true);
    alert(`Transcrição "${transcription.title}" carregada! Em uma versão futura, o conteúdo será inserido diretamente na área de edição.`);
  };

  // Dados falsos das últimas transcrições com conteúdo completo
  const [recentTranscriptions] = useState([
    {
      id: 1,
      title: 'Consulta Cardiologia - Hipertensão',
      specialty: 'Cardiologia',
      date: '15 jan. 2025',
      time: '14:30',
      duration: '12:45',
      excerpt: 'Paciente João Silva, 58 anos, hipertenso. Relata dor torácica episódica. Medicamentos: Losartana 50mg, Amlodipino 5mg. Exame físico: PA 150/90mmHg...',
      status: 'Completa',
      fullContent: `# Anamnese - Consulta Cardiologia

## Identificação do Paciente
- **Nome**: João Silva
- **Idade**: 58 anos
- **Data da consulta**: 15 de janeiro de 2025
- **Horário**: 14:30

## Queixa Principal
Paciente refere hipertensão arterial sistêmica há 5 anos, em tratamento regular. Relata episódios de dor torácica esporádica, geralmente após esforços físicos intensos.

## História da Doença Atual
Há 3 dias, iniciou quadro de dor torácica tipo "peso no peito", irradiando para braço esquerdo, duração de 10-15 minutos. Não associado a sudorese, náuseas ou dispneia. Melhorou com repouso.

## Antecedentes Pessoais
- **HAS**: Diagnosticada há 5 anos
- **DM2**: Não
- **Dislipidemia**: Sim, em tratamento
- **Tabagismo**: Ex-tabagista (20 anos/maço), parou há 8 anos
- **Etilismo**: Social, eventual

## Medicações em Uso
- Losartana 50mg - 1x/dia (manhã)
- Amlodipino 5mg - 1x/dia (noite)
- Sinvastatina 20mg - 1x/dia (noite)
- AAS 100mg - 1x/dia

## Exame Físico
- **PA**: 150/90 mmHg
- **FC**: 72 bpm
- **FR**: 16 irpm
- **Peso**: 82kg
- **Altura**: 1,75m
- **IMC**: 26,8
- **Ausculta cardíaca**: Ritmada, sem sopros
- **Ausculta pulmonar**: MV+ bilateral, sem RA
- **Edema**: Ausente

## Exames Solicitados
- ECG
- Ecocardiograma
- Holter 24h
- Creatinina, ureia, potássio
- Colesterol total e frações

## Plano Terapêutico
- Otimizar controle pressórico
- Manter medicações atuais
- Orientação sobre fatores de risco
- Retorno em 30 dias

## Observações
Paciente orientado sobre importância do controle pressórico e adesão ao tratamento. Reforçada necessidade de atividade física regular e dieta hipossódica.`
    },
    {
      id: 2,
      title: 'Consulta Ginecologia - Rotina',
      specialty: 'Ginecologia',
      date: '14 jan. 2025',
      time: '10:15',
      duration: '08:32',
      excerpt: 'Paciente Maria Santos, 34 anos. Última menstruação há 15 dias. Antecedentes: cesariana há 2 anos. Exame físico normal. Prescrição: anticoncepcional...',
      status: 'Completa',
      fullContent: `# Anamnese - Consulta Ginecologia

## Identificação do Paciente
- **Nome**: Maria Santos
- **Idade**: 34 anos
- **Data da consulta**: 14 de janeiro de 2025
- **Horário**: 10:15

## Queixa Principal
Consulta de rotina ginecológica. Paciente refere ciclos menstruais regulares, sem queixas específicas.

## História Menstrual
- **Menarca**: 12 anos
- **Ciclos**: Regulares a cada 28-30 dias
- **Duração**: 4-5 dias
- **Última menstruação**: 15 de dezembro de 2024
- **Fluxo**: Moderado, sem coágulos

## Antecedentes Obstétricos
- **Gestas**: 2
- **Partos**: 1 (cesariana)
- **Abortos**: 1 (espontâneo)
- **Filhos vivos**: 1

## Antecedentes Pessoais
- **DST**: Não
- **Neoplasia**: Não
- **Tabagismo**: Não
- **Etilismo**: Não

## Método Contraceptivo Atual
Anticoncepcional oral combinado (etinilestradiol + levonorgestrel) há 2 anos, sem intercorrências.

## Exame Físico
- **PA**: 110/70 mmHg
- **Peso**: 58kg
- **Altura**: 1,62m
- **IMC**: 22,1
- **Exame especular**: Colo íntegro, sem lesões
- **Toque vaginal**: Útero em AVF, móvel, indolor
- **Anexos**: Não palpáveis

## Exames Solicitados
- Papanicolau
- Colposcopia (se necessário)
- Ultrassonografia transvaginal

## Plano Terapêutico
- Manter anticoncepção atual
- Retorno em 6 meses
- Orientação sobre rastreamento de câncer cervical

## Prescrição
- Yasmin (etinilestradiol 30mcg + drospirenona 3mg) - 21 comprimidos
- Orientação: iniciar após menstruação atual`
    },
    {
      id: 3,
      title: 'Consulta Pediatria - Infecção',
      specialty: 'Pediatria',
      date: '14 jan. 2025',
      time: '16:45',
      duration: '15:20',
      excerpt: 'Paciente Pedro Oliveira, 5 anos. Febre há 3 dias, tosse produtiva. Diagnóstico: broncopneumonia. Prescrição: Amoxicilina 500mg 3x/dia por 7 dias...',
      status: 'Em andamento',
      fullContent: `# Anamnese - Consulta Pediatria

## Identificação do Paciente
- **Nome**: Pedro Oliveira
- **Idade**: 5 anos
- **Data da consulta**: 14 de janeiro de 2025
- **Horário**: 16:45

## Queixa Principal
Febre há 3 dias, acompanhada de tosse produtiva e dificuldade respiratória.

## História da Doença Atual
Iniciou há 3 dias com febre (38,5-39°C), tosse inicialmente seca evoluindo para produtiva. Relata chiado no peito e dificuldade para respirar, pior à noite. Sem vômitos ou diarreia.

## Antecedentes Pessoais
- **Prematuridade**: Não
- **Internações**: 1 (pneumonia aos 2 anos)
- **Alergias**: Não referidas
- **Imunizações**: Em dia
- **Desenvolvimento**: Adequado para idade

## Antecedentes Familiares
- Pai: saudável
- Mãe: saudável
- Avós: hipertensão e diabetes

## Exame Físico
- **Temperatura**: 38,2°C
- **FC**: 120 bpm
- **FR**: 32 irpm
- **Peso**: 18kg
- **Altura**: 1,10m
- **Estado geral**: Regular, febril
- **Ausculta pulmonar**: Estertores crepitantes em base direita, chiado expiratório difuso
- **Otos**: Sem alterações
- **Orofaringe**: Hiperemiada

## Diagnóstico
Broncopneumonia bacteriana

## Exames Solicitados
- RX de tórax
- Hemograma completo
- PCR

## Plano Terapêutico
- Repouso
- Hidratação oral
- Amoxicilina 500mg VO 3x/dia por 7 dias
- Paracetamol 200mg/ml - 5ml 4/4h se febre
- Retorno em 48h ou antes se piora

## Orientações
- Manter ambiente arejado
- Evitar fumo passivo
- Sinais de alarme: dificuldade respiratória intensa, cianose, convulsões`
    },
    {
      id: 4,
      title: 'Consulta Ortopedia - Fratura',
      specialty: 'Ortopedia',
      date: '13 jan. 2025',
      time: '09:00',
      duration: '18:30',
      excerpt: 'Paciente Ana Costa, 45 anos. Fratura de fêmur esquerdo. Antecedentes de osteoporose. Tratamento cirúrgico: osteossíntese. Prescrição: analgésicos e anticoagulantes...',
      status: 'Completa',
      fullContent: `# Anamnese - Consulta Ortopedia

## Identificação do Paciente
- **Nome**: Ana Costa
- **Idade**: 45 anos
- **Data da consulta**: 13 de janeiro de 2025
- **Horário**: 09:00

## Queixa Principal
Trauma em membro inferior esquerdo após queda da própria altura.

## História do Trauma
Paciente escorregou em piso molhado, caindo sobre o lado esquerdo. Relata dor intensa em coxa esquerda, impossibilidade de deambulação.

## Antecedentes Pessoais
- **Osteoporose**: Diagnosticada há 3 anos
- **Fraturas prévias**: Não
- **Cirurgias**: Colecistectomia há 5 anos
- **Tabagismo**: Não
- **Etilismo**: Não

## Medicações
- Alendronato 70mg - 1x/semana
- Carbonato de cálcio 500mg - 2x/dia
- Vitamina D 2000UI - 1x/dia

## Exame Físico
- **Deformidade**: Presente em terço médio de fêmur esquerdo
- **Edema**: ++ em coxa esquerda
- **Equimose**: Presente
- **Crepitação**: Não
- **Sensibilidade**: +++ à palpação
- **ADM**: Preservada distalmente
- **Pulso**: Presente

## Exames Solicitados
- RX de fêmur esquerdo (AP e perfil)
- Densitometria óssea (se necessário)

## Diagnóstico
Fratura transverso-obliqua de fêmur esquerdo em terço médio

## Plano Terapêutico
- Cirurgia: Osteossíntese com placa e parafusos
- Internação para tratamento cirúrgico
- Profilaxia tromboembólica: Enoxaparina 40mg SC 1x/dia
- Analgesia: Tramadol 50mg VO 6/6h + Dipirona 1g IV 6/6h
- Retorno pós-operatório em 15 dias

## Orientações
- Imobilização temporária até cirurgia
- Cuidado com trombose venosa profunda
- Fisioterapia precoce após cirurgia`
    },
    {
      id: 5,
      title: 'Consulta Dermatologia - Acne',
      specialty: 'Dermatologia',
      date: '12 jan. 2025',
      time: '15:20',
      duration: '06:15',
      excerpt: 'Paciente Lucas Pereira, 22 anos. Acne vulgar moderada. Tratamento: isotretinoína 20mg/dia. Orientação sobre cuidados com a pele e fotoproteção...',
      status: 'Completa',
      fullContent: `# Anamnese - Consulta Dermatologia

## Identificação do Paciente
- **Nome**: Lucas Pereira
- **Idade**: 22 anos
- **Data da consulta**: 12 de janeiro de 2025
- **Horário**: 15:20

## Queixa Principal
Acne vulgar de grau moderado em face, evoluindo há 5 anos.

## História da Doença
Lesões iniciaram na adolescência, localizadas principalmente em face (testa, bochechas, queixo). Agravamento nos últimos 2 anos com aparecimento de nódulos dolorosos.

## Antecedentes Pessoais
- **Alergias**: Não
- **Tratamentos anteriores**: Tópicos (eritromicina, adapaleno) com resposta parcial
- **Cirurgias**: Não
- **Tabagismo**: Não
- **Etilismo**: Não

## Antecedentes Familiares
- Pai: acne na adolescência
- Mãe: saudável

## Exame Físico
- **Lesões**: Comedões abertos e fechados, pápulas eritematosas, pústulas, 2 nódulos
- **Distribuição**: Face (testa, bochechas, queixo)
- **Cicatrizes**: Discretas em regiões temporais
- **Tipo de pele**: Oleosa

## Diagnóstico
Acne vulgar grau II-III

## Plano Terapêutico
- Isotretinoína 20mg/dia (0,5mg/kg) por 6 meses
- Exames pré-tratamento: Triglicerídeos, colesterol, TGO/TGP, beta-HCG
- Controle mensal durante tratamento
- Fotoproteção obrigatória (FPS 30+)
- Hidratante oil-free

## Orientações
- Evitar exposição solar intensa
- Não doar sangue durante tratamento e 1 mês após
- Método contraceptivo eficaz se mulher em idade fértil
- Possíveis efeitos colaterais: ressecamento labial, conjuntival
- Retorno mensal para acompanhamento`
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      {/* Barra Superior com Navegação (antiga inferior) */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="mx-auto flex w-full max-w-[44.25rem] justify-center gap-1">
          <button className="flex size-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800/90 backdrop-blur-[8px] transition-opacity hover:opacity-60" aria-label="Ordenar" type="button">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.7724 8.84119L9.90134 5.73367C9.8283 5.67503 9.7344 5.62478 9.63006 5.59127C9.61962 5.59127 9.60919 5.59127 9.59875 5.5829C9.51528 5.55777 9.43181 5.54102 9.3379 5.54102C9.12922 5.54102 8.93097 5.60802 8.78489 5.72529L4.89296 8.84119C4.59037 9.08409 4.59037 9.48614 4.89296 9.72905C5.19555 9.97196 5.69639 9.97196 5.99898 9.72905L8.55534 7.67691V21.2461C8.55534 21.5896 8.9101 21.8743 9.3379 21.8743C9.7657 21.8743 10.1205 21.5896 10.1205 21.2461V7.68529L12.6664 9.72905C12.8229 9.85469 13.0211 9.91332 13.2194 9.91332C13.4176 9.91332 13.6159 9.85469 13.7724 9.72905C14.075 9.48614 14.075 9.09247 13.7724 8.84119Z"></path>
              <path d="M23.1064 17.6863C22.8038 17.4434 22.303 17.4434 22.0004 17.6863L19.444 19.7385V6.16922C19.444 5.8258 19.0892 5.54102 18.6614 5.54102C18.2337 5.54102 17.8789 5.8258 17.8789 6.16922V19.7301L15.333 17.6863C15.0304 17.4434 14.5295 17.4434 14.2269 17.6863C13.9244 17.9292 13.9244 18.3313 14.2269 18.5742L18.098 21.6817C18.171 21.7403 18.265 21.7906 18.3693 21.8241C18.3797 21.8241 18.3902 21.8241 18.4006 21.8325C18.4841 21.8576 18.578 21.8743 18.6719 21.8743C18.8806 21.8743 19.0788 21.8073 19.2249 21.6901L23.1064 18.5742C23.409 18.3229 23.409 17.9292 23.1064 17.6863Z"></path>
            </svg>
          </button>

          <div className="w-fit max-w-[calc(100%_-_7.5rem)] rounded-full border border-slate-700 bg-slate-800/90 px-3 backdrop-blur-[8px]">
            <div className="relative flex justify-center">
              <div className="w-max max-w-full overflow-hidden">
                <ul className="flex">
                  <li className="min-w-0 max-w-full flex-[0_0_auto]">
                    <button className="relative mx-3 flex min-h-11 items-center justify-center py-2 text-[0.9375rem]/5 font-semibold transition-opacity hover:opacity-60 text-slate-300">
                      Todas
                    </button>
                  </li>
                  <li className="min-w-0 max-w-full flex-[0_0_auto]">
                    <button className="relative mx-3 flex min-h-11 items-center justify-center py-2 text-[0.9375rem]/5 font-semibold transition-opacity hover:opacity-60 text-slate-300">
                      Sem etiquetas
                    </button>
                  </li>
                  <li className="min-w-0 max-w-full flex-[0_0_auto]">
                    <button className="relative mx-3 flex min-h-11 items-center justify-center py-2 text-[0.9375rem]/5 font-semibold transition-opacity hover:opacity-60 text-slate-300">
                      Arquivo
                    </button>
                  </li>
                  <li className="min-w-0 max-w-full flex-[0_0_auto]">
                    <button aria-label="Editar" className="flex h-full w-8 items-center justify-center rounded-full transition-opacity hover:opacity-60" type="button">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-4 text-slate-500">
                        <path d="M19.02 5.47997C17.08 3.53997 15.18 3.48997 13.19 5.47997L11.98 6.68997C11.88 6.78997 11.84 6.94997 11.88 7.08997C12.64 9.73997 14.76 11.86 17.41 12.62C17.45 12.63 17.49 12.64 17.53 12.64C17.64 12.64 17.74 12.6 17.82 12.52L19.02 11.31C20.01 10.33 20.49 9.37997 20.49 8.41997C20.5 7.42997 20.02 6.46997 19.02 5.47997Z"></path>
                        <path d="M15.61 13.53C15.32 13.39 15.04 13.25 14.77 13.09C14.55 12.96 14.34 12.82 14.13 12.67C13.96 12.56 13.76 12.4 13.57 12.24C13.55 12.23 13.48 12.17 13.4 12.09C13.07 11.81 12.7 11.45 12.37 11.05C12.34 11.03 12.29 10.96 12.22 10.87C12.12 10.75 11.95 10.55 11.8 10.32C11.68 10.17 11.54 9.94999 11.41 9.72999C11.25 9.45999 11.11 9.18999 10.97 8.90999C10.9488 8.86459 10.9283 8.81943 10.9085 8.77452C10.7609 8.44121 10.3262 8.34376 10.0685 8.60152L4.34001 14.33C4.21001 14.46 4.09001 14.71 4.06001 14.88L3.52001 18.71C3.42001 19.39 3.61001 20.03 4.03001 20.46C4.39001 20.81 4.89001 21 5.43001 21C5.55001 21 5.67001 20.99 5.79001 20.97L9.63001 20.43C9.81001 20.4 10.06 20.28 10.18 20.15L15.9013 14.4287C16.1609 14.1691 16.063 13.7237 15.7254 13.5796C15.6874 13.5634 15.6489 13.5469 15.61 13.53Z"></path>
                      </svg>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <button className="flex size-11 items-center justify-center rounded-full border border-slate-700 bg-slate-800/90 backdrop-blur-[8px] transition-opacity hover:opacity-60" aria-label="Configurações" type="button" onClick={toggleSidebar}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.0968 6.32333L16.0651 2.83499C14.9101 2.16999 13.1018 2.16999 11.9468 2.83499L5.85676 6.34666C3.44176 7.97999 3.30176 8.22499 3.30176 10.8267V17.1617C3.30176 19.7633 3.44176 20.02 5.90342 21.6767L11.9351 25.165C12.5184 25.5033 13.2651 25.6667 14.0001 25.6667C14.7351 25.6667 15.4818 25.5033 16.0534 25.165L22.1434 21.6533C24.5584 20.02 24.6984 19.775 24.6984 17.1733V10.8267C24.6984 8.22499 24.5584 7.97999 22.0968 6.32333ZM14.0001 17.7917C11.9118 17.7917 10.2084 16.0883 10.2084 14C10.2084 11.9117 11.9118 10.2083 14.0001 10.2083C16.0884 10.2083 17.7918 11.9117 17.7918 14C17.7918 16.0883 16.0884 17.7917 14.0001 17.7917Z"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Barra Inferior com Controles (antiga superior) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-2 py-1 backdrop-blur-menu">
          <button className="flex size-11 items-center justify-center rounded-full text-white transition-opacity hover:opacity-50" type="button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M10 15V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
          <button onClick={startRecording} className="flex h-[3.375rem] w-[7.5rem] items-center justify-center rounded-full bg-medical-600 transition-opacity hover:opacity-60 text-white">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g className="fill-white">
                <path d="M24.3 46.8604C14.22 46.8604 6 38.6604 6 28.5604V24.8004C6 24.0204 6.64 23.4004 7.4 23.4004C8.16 23.4004 8.8 24.0404 8.8 24.8004V28.5604C8.8 37.1004 15.74 44.0404 24.28 44.0404C32.82 44.0404 39.76 37.1004 39.76 28.5604V24.8004C39.76 24.0204 40.4 23.4004 41.16 23.4004C41.92 23.4004 42.56 24.0404 42.56 24.8004V28.5604C42.6 38.6604 34.38 46.8604 24.3 46.8604Z"></path>
                <rect x="12.3008" y="5" width="24" height="36" rx="12"></rect>
              </g>
              <g className="fill-slate-900">
                <path fillRule="evenodd" clipRule="evenodd" d="M20.4038 18C19.0762 18 18 19.0762 18 20.4038C18 21.7315 19.0762 22.8077 20.4038 22.8077C21.7315 22.8077 22.8077 21.7315 22.8077 20.4038C22.8077 20.1007 22.3672 20.02 22.0707 20.083C22.008 20.0964 21.9429 20.1034 21.8762 20.1034C21.3618 20.1034 20.9447 19.6863 20.9447 19.1719C20.9447 18.7283 20.9126 18.0127 20.4692 18.0009C20.4475 18.0003 20.4257 18 20.4038 18Z"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M28.0953 18C26.7676 18 25.6914 19.0762 25.6914 20.4038C25.6914 21.7315 26.7676 22.8077 28.0953 22.8077C29.4229 22.8077 30.4991 21.7315 30.4991 20.4038C30.4991 20.1007 30.0587 20.02 29.7621 20.083C29.6994 20.0964 29.6343 20.1034 29.5676 20.1034C29.0532 20.1034 28.6361 19.6863 28.6361 19.1719C28.6361 18.7283 28.604 18.0127 28.1606 18.0009C28.1389 18.0003 28.1171 18 28.0953 18Z"></path>
              </g>
            </svg>
          </button>
          <button className="flex size-11 items-center justify-center rounded-full text-white transition-opacity hover:opacity-50" aria-label="Pesquisar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.58268 17.4993C13.9549 17.4993 17.4993 13.9549 17.4993 9.58268C17.4993 5.21043 13.9549 1.66602 9.58268 1.66602C5.21043 1.66602 1.66602 5.21043 1.66602 9.58268C1.66602 13.9549 5.21043 17.4993 9.58268 17.4993Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M18.3327 18.3327L16.666 16.666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Interface de Transcrição */}
      <div className="container relative max-w-7xl mx-auto pt-20 pb-8">
        <div className="grid lg:grid-cols-2 items-start gap-12 lg:gap-16 relative px-2 sm:px-0">
          <div className="flex flex-1 flex-col gap-3 lg:col-span-2 max-w-3xl mx-auto">
            {/* Últimas Transcrições */}
            <div className="space-y-3">
              {/* Header com botão de expansão */}
              <button
                onClick={() => setIsTranscriptionsExpanded(!isTranscriptionsExpanded)}
                className="flex w-full items-center justify-between text-lg font-semibold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
              >
                <span>Últimas transcrições</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {recentTranscriptions.length} registros
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`text-gray-500 transition-transform duration-200 ${
                      isTranscriptionsExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                  </svg>
                </div>
              </button>

              {/* Visualização empilhada (colapsada) */}
              {!isTranscriptionsExpanded && (
                <div className="relative">
                  {/* Cards empilhados - todos com mesmo tamanho */}
                  {recentTranscriptions.slice(0, 3).map((transcription, index) => (
                    <div
                      key={transcription.id}
                      className="relative -mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow"
                      style={{
                        marginLeft: index > 0 ? `${index * 12}px` : '0px',
                        zIndex: 10 - index
                      }}
                      onClick={() => loadTranscriptionContent(transcription)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full flex items-center justify-center ${
                            index === 0
                              ? 'h-10 w-10 bg-blue-100 dark:bg-blue-900'
                              : 'h-8 w-8 bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <svg
                              width={index === 0 ? "20" : "16"}
                              height={index === 0 ? "20" : "16"}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className={
                                index === 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-400"
                              }
                            >
                              <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className={`font-medium text-gray-900 dark:text-white ${
                              index === 0
                                ? 'text-base'
                                : 'text-sm text-gray-700 dark:text-gray-300'
                            }`}>
                              {transcription.title}
                            </h3>
                            <p className={`text-gray-500 dark:text-gray-400 ${
                              index === 0
                                ? 'text-sm'
                                : 'text-xs'
                            }`}>
                              {transcription.specialty} • {transcription.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            transcription.status === 'Completa'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {transcription.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Indicador de mais registros */}
                  {recentTranscriptions.length > 3 && (
                    <div className="relative -mt-3 ml-12 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-center justify-center py-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          +{recentTranscriptions.length - 3} registros
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visualização expandida com scroll */}
              {isTranscriptionsExpanded && (
                <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <div className="grid gap-3 p-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {recentTranscriptions.map((transcription) => (
                      <div
                        key={transcription.id}
                        className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-600 dark:bg-gray-800"
                      >
                        {/* Status indicator */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              transcription.status === 'Completa'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {transcription.status}
                          </span>
                        </div>

                        {/* Header */}
                        <div className="mb-3">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                            {transcription.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {transcription.specialty}
                            </span>
                            <span>{transcription.date}</span>
                            <span>{transcription.time}</span>
                          </div>
                        </div>

                        {/* Content excerpt */}
                        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 overflow-hidden"
                           style={{
                             display: '-webkit-box',
                             WebkitLineClamp: 3,
                             WebkitBoxOrient: 'vertical',
                             lineHeight: '1.4',
                             maxHeight: '4.2rem'
                           }}>
                          {transcription.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                              <path fillRule="evenodd" clipRule="evenodd" d="M8 2C6.89543 2 6 2.89543 6 4V8C6 9.10457 6.89543 10 8 10C9.10457 10 10 9.10457 10 8V4C10 2.89543 9.10457 2 8 2ZM8.5 12.5C8.5 13.3284 7.82843 14 7 14C6.17157 14 5.5 13.3284 5.5 12.5C5.5 11.6716 6.17157 11 7 11C7.82843 11 8.5 11.6716 8.5 12.5Z"/>
                            </svg>
                            {transcription.duration}
                          </div>

                          <button className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                            Continuar
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
                              <path d="M4.5 2L7.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Título editável */}
            <div className="relative">
              <div
                className="text-[1.75rem]/[2.125rem] font-semibold focus-visible:outline-none text-gray-900 dark:text-white"
                contentEditable="true"
                role="textbox"
                spellCheck="true"
                data-lexical-editor="true"
                style={{
                  userSelect: 'text',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                <p dir="auto">
                  <span data-lexical-text="true">Anamnese do Paciente</span>
                </p>
              </div>
            </div>

            {/* Área de texto editável */}
            <div className="relative h-full min-h-[50vh]">
              <div
                className="h-full bg-transparent pb-[20vh] text-[1.0625rem]/[1.6] text-gray-900 focus-visible:outline-none dark:text-white"
                contentEditable="true"
                role="textbox"
                spellCheck="true"
                data-lexical-editor="true"
                onInput={(e) => handleTranscriptionChange(e.target.textContent)}
                style={{
                  userSelect: 'text',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                <p dir="auto">
                  <span data-lexical-text="true">Anamnese do Paciente</span>
                </p>
                <p dir="auto"><br /></p>
              </div>
              <div className="pointer-events-none absolute top-0 text-[1.0625rem]/[1.6] text-gray-900 opacity-50 dark:text-white">
                Escreva algo...
              </div>
              <div className="absolute left-0 select-none" style={{ top: '27.2px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionPage;