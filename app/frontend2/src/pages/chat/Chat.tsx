import {
    useRef,
    useState,
    useEffect,
    useCallback,
    Dispatch,
    SetStateAction,
    useImperativeHandle,
    forwardRef
} from "react";
import { Checkbox, Panel, DefaultButton, TextField, SpinButton, Slider } from "@fluentui/react";
import { SparkleFilled } from "@fluentui/react-icons";
import readNDJSONStream from "ndjson-readablestream";

import styles from "./Chat.module.css";

import {
    chatApi,
    chat2Api,
    configApi,
    RetrievalMode,
    ChatAppResponse,
    ChatAppResponseOrError,
    ChatAppRequest,
    ResponseMessage,
    VectorFieldOptions,
    GPT4VInput,
    askApi
} from "../../api";
import { Answer, AnswerError, AnswerLoading } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { UserChatMessage } from "../../components/UserChatMessage";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton";
import { ClearChatButton } from "../../components/ClearChatButton";
import { UploadFile } from "../../components/UploadFile";
import { useLogin, getToken, isLoggedIn, requireAccessControl } from "../../authConfig";
import { VectorSettings } from "../../components/VectorSettings";
import { useMsal } from "@azure/msal-react";
import { TokenClaimsDisplay } from "../../components/TokenClaimsDisplay";
import { GPT4VSettings } from "../../components/GPT4VSettings";
import { TYPES_OF_CHAT_CONFIG, THEMES } from "../../helpers/constants";
// import PrintButton from "../../components/PrintButton/PrintButton";


type ChatProps = {
    activeUseCase: THEMES;
    isLoading: boolean;
    hasUserScrolledUp: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
};    

export interface ChatHandles {
    clearChat: () => void;
}

const Chat = forwardRef<ChatHandles, ChatProps>(
    (
        { activeUseCase, isLoading, hasUserScrolledUp, setIsLoading }: ChatProps,
        ref
    ) => {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [temperature, setTemperature] = useState<number>(0.3);
    const [minimumRerankerScore, setMinimumRerankerScore] = useState<number>(0);
    const [minimumSearchScore, setMinimumSearchScore] = useState<number>(0);
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(RetrievalMode.Hybrid);
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [shouldStream, setShouldStream] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [useSuggestFollowupQuestions, setUseSuggestFollowupQuestions] = useState<boolean>(false);
    const [vectorFieldList, setVectorFieldList] = useState<VectorFieldOptions[]>([VectorFieldOptions.Embedding]);
    const [useOidSecurityFilter, setUseOidSecurityFilter] = useState<boolean>(false);
    const [useGroupsSecurityFilter, setUseGroupsSecurityFilter] = useState<boolean>(false);
    const [gpt4vInput, setGPT4VInput] = useState<GPT4VInput>(GPT4VInput.TextAndImages);
    const [useGPT4V, setUseGPT4V] = useState<boolean>(false);

    const lastQuestionRef = useRef<string>("");
    const chatMessageStreamEnd = useRef<HTMLDivElement | null>(null);

    // const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | null>(null);

    const [selectedAnswer, setSelectedAnswer] = useState<number>(0);
    const [answers, setAnswers] = useState<[user: string, response: ChatAppResponse][]>([]);
    const [streamedAnswers, setStreamedAnswers] = useState<[user: string, response: ChatAppResponse][]>([]);
    const [showGPT4VOptions, setShowGPT4VOptions] = useState<boolean>(false);
    const [showSemanticRankerOption, setShowSemanticRankerOption] = useState<boolean>(false);
    const [showVectorOption, setShowVectorOption] = useState<boolean>(false);
    const [showUserUpload, setShowUserUpload] = useState<boolean>(false);
    const [isAnalysisPanelExpanded, setIsAnalysisPanelExpanded] = useState<boolean>(false);

    const chatRef = useRef<HTMLDivElement>(null);

    const getConfig = async () => {

        const token = client ? await getToken(client) : undefined;
        
        configApi(token).then(config => {
            setShowGPT4VOptions(config.showGPT4VOptions);
            setUseSemanticRanker(config.showSemanticRankerOption);
            setShowSemanticRankerOption(config.showSemanticRankerOption);
            setShowVectorOption(config.showVectorOption);
            if (!config.showVectorOption) {
                setRetrievalMode(RetrievalMode.Text);
            }
            setShowUserUpload(config.showUserUpload);
        });
    };

    const handleUseCaseRequest = async (
        request: ChatAppRequest,
        token: string | undefined
    ): Promise<Response> => {

        if (activeUseCase === THEMES.THEME_1)
            return await askApi(request, token);
        if (activeUseCase === THEMES.THEME_2)
            return await chatApi(request, token);
        if (activeUseCase === THEMES.THEME_3)
            return await chat2Api(request, token);
        throw new Error(`Unhandled use case: ${activeUseCase}`);
    };

    const handleAsyncRequest = async (question: string, answers: [string, ChatAppResponse][], setAnswers: Function, responseBody: ReadableStream<any>) => {
        let answer: string = "";
        let askResponse: ChatAppResponse = {} as ChatAppResponse;

        const updateState = (newContent: string) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    answer += newContent;
                    const latestResponse: ChatAppResponse = {
                        ...askResponse,
                        choices: [{ ...askResponse.choices[0], message: { content: answer, role: askResponse.choices[0].message.role } }]
                    };
                    setStreamedAnswers([...answers, [question, latestResponse]]);
                    resolve(null);
                }, 33);
            });
        };
        try {
            setIsStreaming(true);
            for await (const event of readNDJSONStream(responseBody)) {
                if (event["choices"] && event["choices"][0]["context"] && event["choices"][0]["context"]["data_points"]) {
                    event["choices"][0]["message"] = event["choices"][0]["delta"];
                    askResponse = event as ChatAppResponse;
                } else if (event["choices"] && event["choices"][0]["delta"]["content"]) {
                    setIsLoading(false);
                    await updateState(event["choices"][0]["delta"]["content"]);
                } else if (event["choices"] && event["choices"][0]["context"]) {
                    // Update context with new keys from latest event
                    askResponse.choices[0].context = { ...askResponse.choices[0].context, ...event["choices"][0]["context"] };
                } else if (event["error"]) {
                    throw Error(event["error"]);
                }
            }
        } finally {
            setIsStreaming(false);
        }
        const fullResponse: ChatAppResponse = {
            ...askResponse,
            choices: [{ ...askResponse.choices[0], message: { content: answer, role: askResponse.choices[0].message.role } }]
        };
        return fullResponse;
    };

    const client = useLogin ? useMsal().instance : undefined;

    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);
        localStorage.removeItem(`fetched_${activeCitation}`);


        const token = client ? await getToken(client) : undefined;

        try {
            const messages: ResponseMessage[] = answers.flatMap(a => [
                { content: a[0], role: "user" },
                { content: a[1].choices[0].message.content, role: "assistant" }
            ]);

            const request: ChatAppRequest = {
                messages: [...messages, { content: question, role: "user" }],
                stream: shouldStream,
                context: {
                    overrides: {
                        prompt_template: promptTemplate.length === 0 ? undefined : promptTemplate,
                        exclude_category: excludeCategory.length === 0 ? undefined : excludeCategory,
                        top: retrieveCount,
                        temperature: temperature,
                        minimum_reranker_score: minimumRerankerScore,
                        minimum_search_score: minimumSearchScore,
                        retrieval_mode: retrievalMode,
                        semantic_ranker: useSemanticRanker,
                        semantic_captions: useSemanticCaptions,
                        suggest_followup_questions: useSuggestFollowupQuestions,
                        use_oid_security_filter: useOidSecurityFilter,
                        use_groups_security_filter: useGroupsSecurityFilter,
                        vector_fields: vectorFieldList,
                        use_gpt4v: useGPT4V,
                        gpt4v_input: gpt4vInput
                    }
                },
                // ChatAppProtocol: Client must pass on any session state received from the server
                session_state: answers.length ? answers[answers.length - 1][1].choices[0].session_state : null
            };
            const response = await handleUseCaseRequest(request, token);
            // const response = await chatApi(request, token);
            if (!response.body) {
                throw Error("No response body");
            }
            if (shouldStream) {
                const parsedResponse: ChatAppResponse = await handleAsyncRequest(question, answers, setAnswers, response.body);
                setAnswers([...answers, [question, parsedResponse]]);
            } else {
                const parsedResponse: ChatAppResponseOrError = await response.json();
                if (response.status > 299 || !response.ok) {
                    throw Error(parsedResponse.error || "Unknown error");
                }
                setAnswers([...answers, [question, parsedResponse as ChatAppResponse]]);
            }
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const clearStates = () => {
        lastQuestionRef.current = "";
        error && setError(undefined);
        setActiveCitation("");
        setActiveAnalysisPanelTab(null);
        localStorage.removeItem(`fetched_${activeCitation}`);

        setAnswers([]);
        setStreamedAnswers([]);
        setIsLoading(false);
        setIsStreaming(false);
        setIsAnalysisPanelExpanded(false);
    };

    // const clearChat = () => {
    //     lastQuestionRef.current = "";
    //     error && setError(undefined);
    //     setActiveCitation(undefined);
    //     setActiveAnalysisPanelTab(undefined);
    //     // localStorage.removeItem(`fetched_${activeCitation}`);

    //     setAnswers([]);
    //     setStreamedAnswers([]);
    //     setIsLoading(false);
    //     setIsStreaming(false);
    // };

    const clearChat = () => {
        clearStates();
        localStorage.removeItem(`chat_conversation_${activeUseCase}`);
        localStorage.removeItem(`fetched_${activeCitation}`);
    };

    useImperativeHandle(ref, () => ({
        clearChat
    }));

    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "smooth" }), [isLoading]);
    useEffect(() => chatMessageStreamEnd.current?.scrollIntoView({ behavior: "auto" }), [streamedAnswers, isStreaming, hasUserScrolledUp]]);
    
    useEffect(() => {
        clearStates();

        const storedConversation = localStorage.getItem(
            `chat_conversation_${activeUseCase}`
        );
        if (storedConversation) {
            const parsedConversation = JSON.parse(storedConversation);
            setAnswers(parsedConversation);
        if (parsedConversation.length > 0) {
            lastQuestionRef.current =
            parsedConversation[parsedConversation.length - 1][0];
        }
        } else {
            clearChat();
        }
        getConfig();
    }, [activeUseCase]);

    const onPromptTemplateChange = (_ev?: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setPromptTemplate(newValue || "");
    };

    const onTemperatureChange = (
        newValue: number,
        range?: [number, number],
        event?: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent | React.KeyboardEvent
    ) => {
        setTemperature(newValue);
    };

    const onMinimumSearchScoreChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setMinimumSearchScore(parseFloat(newValue || "0"));
    };

    const onMinimumRerankerScoreChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setMinimumRerankerScore(parseFloat(newValue || "0"));
    };

    const onRetrieveCountChange = (_ev?: React.SyntheticEvent<HTMLElement, Event>, newValue?: string) => {
        setRetrieveCount(parseInt(newValue || "3"));
    };

    const onUseSemanticRankerChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticRanker(!!checked);
    };

    const onUseSemanticCaptionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSemanticCaptions(!!checked);
    };

    const onShouldStreamChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setShouldStream(!!checked);
    };

    const onExcludeCategoryChanged = (_ev?: React.FormEvent, newValue?: string) => {
        setExcludeCategory(newValue || "");
    };

    const onUseSuggestFollowupQuestionsChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseSuggestFollowupQuestions(!!checked);
    };

    const onUseOidSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseOidSecurityFilter(!!checked);
    };

    const onUseGroupsSecurityFilterChange = (_ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => {
        setUseGroupsSecurityFilter(!!checked);
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
    };

    // const onShowCitation = (citation: string, index: number) => {
    //     if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab && selectedAnswer === index) {
    //         setActiveAnalysisPanelTab(undefined);
    //     } else {
    //         setActiveCitation(citation);
    //         setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
    //     }

    //     setSelectedAnswer(index);
    // };

    const onShowCitation = (citation: string, index: number) => {
        if (
            activeCitation === citation &&
            activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab &&
            selectedAnswer === index
        ) {
            setActiveAnalysisPanelTab(null);
            localStorage.removeItem(`fetched_${activeCitation}`);

            setIsAnalysisPanelExpanded(false);
        } else {
            localStorage.removeItem(`fetched_${citation}`);
    
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }

        setSelectedAnswer(index);
    };

    // const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
    //     if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
    //         setActiveAnalysisPanelTab(undefined);
    //     } else {
    //         setActiveAnalysisPanelTab(tab);
    //     }

    //     setSelectedAnswer(index);
    // };

    const onToggleTab = (tab: AnalysisPanelTabs, index: number) => {
        if (activeAnalysisPanelTab === tab && selectedAnswer === index) {
            localStorage.removeItem(`fetched_${activeCitation}`);
    
            // setActiveAnalysisPanelTab(null);
            // setIsAnalysisPanelExpanded(false);
        } else {
            setActiveAnalysisPanelTab(tab);
        }

        setSelectedAnswer(index);
    };

    const togglePanelExpansion = () => {
        // setIsAnalysisPanelExpanded(!isAnalysisPanelExpanded);
    };

    // return (
    //     <div className={styles.container}>
    //         <div className={styles.commandsContainer}>
    //             <ClearChatButton className={styles.commandButton} onClick={clearChat} disabled={!lastQuestionRef.current || isLoading} />
    //             {showUserUpload && <UploadFile className={styles.commandButton} disabled={!isLoggedIn(client)} />}
    //             <SettingsButton className={styles.commandButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
    //         </div>
    //         <div className={styles.chatRoot}>
    //             <div className={styles.chatContainer}>
    //                 {!lastQuestionRef.current ? (
    //                     <div className={styles.chatEmptyState}>
    //                         <SparkleFilled fontSize={"120px"} primaryFill={"rgba(115, 118, 225, 1)"} aria-hidden="true" aria-label="Chat logo" />
    //                         <h1 className={styles.chatEmptyStateTitle}>Chat with your data</h1>
    //                         <h2 className={styles.chatEmptyStateSubtitle}>Ask anything or try an example</h2>
    //                         <ExampleList onExampleClicked={onExampleClicked} useGPT4V={useGPT4V} />
    //                     </div>
    //                 ) : (
    //                     <div className={styles.chatMessageStream}>
    //                         {isStreaming &&
    //                             streamedAnswers.map((streamedAnswer, index) => (
    //                                 <div key={index}>
    //                                     <UserChatMessage message={streamedAnswer[0]} />
    //                                     <div className={styles.chatMessageGpt}>
    //                                         <Answer
    //                                             isStreaming={true}
    //                                             key={index}
    //                                             answer={streamedAnswer[1]}
    //                                             isSelected={false}
    //                                             onCitationClicked={c => onShowCitation(c, index)}
    //                                             onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
    //                                             onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
    //                                             onFollowupQuestionClicked={q => makeApiRequest(q)}
    //                                             showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
    //                                         />
    //                                     </div>
    //                                 </div>
    //                             ))}
    //                         {!isStreaming &&
    //                             answers.map((answer, index) => (
    //                                 <div key={index}>
    //                                     <UserChatMessage message={answer[0]} />
    //                                     <div className={styles.chatMessageGpt}>
    //                                         <Answer
    //                                             isStreaming={false}
    //                                             key={index}
    //                                             answer={answer[1]}
    //                                             isSelected={selectedAnswer === index && activeAnalysisPanelTab !== undefined}
    //                                             onCitationClicked={c => onShowCitation(c, index)}
    //                                             onThoughtProcessClicked={() => onToggleTab(AnalysisPanelTabs.ThoughtProcessTab, index)}
    //                                             onSupportingContentClicked={() => onToggleTab(AnalysisPanelTabs.SupportingContentTab, index)}
    //                                             onFollowupQuestionClicked={q => makeApiRequest(q)}
    //                                             showFollowupQuestions={useSuggestFollowupQuestions && answers.length - 1 === index}
    //                                         />
    //                                     </div>
    //                                 </div>
    //                             ))}
    //                         {isLoading && (
    //                             <>
    //                                 <UserChatMessage message={lastQuestionRef.current} />
    //                                 <div className={styles.chatMessageGptMinWidth}>
    //                                     <AnswerLoading />
    //                                 </div>
    //                             </>
    //                         )}
    //                         {error ? (
    //                             <>
    //                                 <UserChatMessage message={lastQuestionRef.current} />
    //                                 <div className={styles.chatMessageGptMinWidth}>
    //                                     <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
    //                                 </div>
    //                             </>
    //                         ) : null}
    //                         <div ref={chatMessageStreamEnd} />
    //                     </div>
    //                 )}

    //                 <div className={styles.chatInput}>
    //                     <QuestionInput
    //                         clearOnSend
    //                         placeholder="Type a new question (e.g. does my plan cover annual eye exams?)"
    //                         disabled={isLoading}
    //                         onSend={question => makeApiRequest(question)}
    //                     />
    //                 </div>
    //             </div>

    //             {answers.length > 0 && activeAnalysisPanelTab && (
    //                 <AnalysisPanel
    //                     className={styles.chatAnalysisPanel}
    //                     activeCitation={activeCitation}
    //                     onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
    //                     citationHeight="810px"
    //                     answer={answers[selectedAnswer][1]}
    //                     activeTab={activeAnalysisPanelTab}
    //                 />
    //             )}

    //             <Panel
    //                 headerText="Configure answer generation"
    //                 isOpen={isConfigPanelOpen}
    //                 isBlocking={false}
    //                 onDismiss={() => setIsConfigPanelOpen(false)}
    //                 closeButtonAriaLabel="Close"
    //                 onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>Close</DefaultButton>}
    //                 isFooterAtBottom={true}
    //             >
    //                 <TextField
    //                     className={styles.chatSettingsSeparator}
    //                     defaultValue={promptTemplate}
    //                     label="Override prompt template"
    //                     multiline
    //                     autoAdjustHeight
    //                     onChange={onPromptTemplateChange}
    //                 />

    //                 <Slider
    //                     className={styles.chatSettingsSeparator}
    //                     label="Temperature"
    //                     min={0}
    //                     max={1}
    //                     step={0.1}
    //                     defaultValue={temperature}
    //                     onChange={onTemperatureChange}
    //                     showValue
    //                     snapToStep
    //                 />

    //                 <SpinButton
    //                     className={styles.chatSettingsSeparator}
    //                     label="Minimum search score"
    //                     min={0}
    //                     step={0.01}
    //                     defaultValue={minimumSearchScore.toString()}
    //                     onChange={onMinimumSearchScoreChange}
    //                 />

    //                 <SpinButton
    //                     className={styles.chatSettingsSeparator}
    //                     label="Minimum reranker score"
    //                     min={1}
    //                     max={4}
    //                     step={0.1}
    //                     defaultValue={minimumRerankerScore.toString()}
    //                     onChange={onMinimumRerankerScoreChange}
    //                 />

    //                 <SpinButton
    //                     className={styles.chatSettingsSeparator}
    //                     label="Retrieve this many search results:"
    //                     min={1}
    //                     max={50}
    //                     defaultValue={retrieveCount.toString()}
    //                     onChange={onRetrieveCountChange}
    //                 />
    //                 <TextField className={styles.chatSettingsSeparator} label="Exclude category" onChange={onExcludeCategoryChanged} />

    //                 {showSemanticRankerOption && (
    //                     <Checkbox
    //                         className={styles.chatSettingsSeparator}
    //                         checked={useSemanticRanker}
    //                         label="Use semantic ranker for retrieval"
    //                         onChange={onUseSemanticRankerChange}
    //                     />
    //                 )}
    //                 <Checkbox
    //                     className={styles.chatSettingsSeparator}
    //                     checked={useSemanticCaptions}
    //                     label="Use query-contextual summaries instead of whole documents"
    //                     onChange={onUseSemanticCaptionsChange}
    //                     disabled={!useSemanticRanker}
    //                 />
    //                 <Checkbox
    //                     className={styles.chatSettingsSeparator}
    //                     checked={useSuggestFollowupQuestions}
    //                     label="Suggest follow-up questions"
    //                     onChange={onUseSuggestFollowupQuestionsChange}
    //                 />

    //                 {showGPT4VOptions && (
    //                     <GPT4VSettings
    //                         gpt4vInputs={gpt4vInput}
    //                         isUseGPT4V={useGPT4V}
    //                         updateUseGPT4V={useGPT4V => {
    //                             setUseGPT4V(useGPT4V);
    //                         }}
    //                         updateGPT4VInputs={inputs => setGPT4VInput(inputs)}
    //                     />
    //                 )}

    //                 {showVectorOption && (
    //                     <VectorSettings
    //                         defaultRetrievalMode={retrievalMode}
    //                         showImageOptions={useGPT4V && showGPT4VOptions}
    //                         updateVectorFields={(options: VectorFieldOptions[]) => setVectorFieldList(options)}
    //                         updateRetrievalMode={(retrievalMode: RetrievalMode) => setRetrievalMode(retrievalMode)}
    //                     />
    //                 )}

    //                 {useLogin && (
    //                     <Checkbox
    //                         className={styles.chatSettingsSeparator}
    //                         checked={useOidSecurityFilter || requireAccessControl}
    //                         label="Use oid security filter"
    //                         disabled={!isLoggedIn(client) || requireAccessControl}
    //                         onChange={onUseOidSecurityFilterChange}
    //                     />
    //                 )}
    //                 {useLogin && (
    //                     <Checkbox
    //                         className={styles.chatSettingsSeparator}
    //                         checked={useGroupsSecurityFilter || requireAccessControl}
    //                         label="Use groups security filter"
    //                         disabled={!isLoggedIn(client) || requireAccessControl}
    //                         onChange={onUseGroupsSecurityFilterChange}
    //                     />
    //                 )}

    //                 <Checkbox
    //                     className={styles.chatSettingsSeparator}
    //                     checked={shouldStream}
    //                     label="Stream chat completion responses"
    //                     onChange={onShouldStreamChange}
    //                 />
    //                 {useLogin && <TokenClaimsDisplay />}
    //             </Panel>
    //         </div>
    //     </div>
    // );
    return (
        <div className={styles.container}>
        <div className={styles.commandsContainer}>
        <ClearChatButton
            className={styles.commandButton}
            onClick={clearChat}
            disabled={!lastQuestionRef.current || isLoading}
        />
        <SettingsButton
            className={styles.commandButton}
            onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
        />
        {/* <PrintButton
            chatRef={chatRef}
            disabled={!lastQuestionRef.current || isLoading}
        /> */}
        </div>
        <div className={styles.chatRoot}>
        <div
            className={`${styles.chatContainer} ${
            isAnalysisPanelExpanded && styles.hideChat
            }`}
        >
            {!lastQuestionRef.current ? (
            <div className={styles.chatEmptyState}>
                <h1 className={styles.chatEmptyStateTitle}>
                Chat with your data
                </h1>
                <h2 className={styles.chatEmptyStateSubtitle}>
                Ask anything or try an example
                </h2>
                <ExampleList
                    onExampleClicked={onExampleClicked}
                    useGPT4V={useGPT4V}
                    activeUseCase={activeUseCase}
                />
            </div>
            ) : (
            <div className={styles.chatMessageStream} ref={chatRef}>
                {isStreaming &&
                streamedAnswers.map((streamedAnswer, index) => (
                    <div key={index}>
                    <UserChatMessage message={streamedAnswer[0]} />
                    <div className={styles.chatMessageGpt}>
                        <Answer
                        isStreaming={true}
                        isLastAnswer={
                            streamedAnswers.length - 1 === index && !isLoading
                        }
                        key={index}
                        answer={streamedAnswer[1]}
                        isSelected={false}
                        onCitationClicked={c => onShowCitation(c, index)}
                        onThoughtProcessClicked={() =>
                            onToggleTab(
                            AnalysisPanelTabs.ThoughtProcessTab,
                            index
                            )
                        }
                        onSupportingContentClicked={() =>
                            onToggleTab(
                            AnalysisPanelTabs.SupportingContentTab,
                            index
                            )
                        }
                        onFollowupQuestionClicked={q => makeApiRequest(q)}
                        showFollowupQuestions={
                            useSuggestFollowupQuestions &&
                            answers.length - 1 === index
                        }
                        />
                    </div>
                    </div>
                ))}
                {!isStreaming &&
                answers.map((answer, index) => (
                    <div key={index}>
                    <UserChatMessage message={answer[0]} />
                    <div className={styles.chatMessageGpt}>
                        <Answer
                        isStreaming={false}
                        isLastAnswer={
                            answers.length - 1 === index && !isLoading
                        }
                        key={index}
                        answer={answer[1]}
                        isSelected={
                            selectedAnswer === index &&
                            activeAnalysisPanelTab !== null
                        }
                        onCitationClicked={c => onShowCitation(c, index)}
                        onThoughtProcessClicked={() =>
                            onToggleTab(
                            AnalysisPanelTabs.ThoughtProcessTab,
                            index
                            )
                        }
                        onSupportingContentClicked={() =>
                            onToggleTab(
                            AnalysisPanelTabs.SupportingContentTab,
                            index
                            )
                        }
                        onFollowupQuestionClicked={q => makeApiRequest(q)}
                        showFollowupQuestions={
                            useSuggestFollowupQuestions &&
                            answers.length - 1 === index
                        }
                        />
                    </div>
                    </div>
                ))}
                {isLoading && (
                <>
                    <UserChatMessage message={lastQuestionRef.current} />
                    <div className={styles.chatMessageGptMinWidth}>
                    <AnswerLoading />
                    </div>
                </>
                )}
                {error ? (
                <>
                    <UserChatMessage message={lastQuestionRef.current} />
                    <div className={styles.chatMessageGptMinWidth}>
                    <AnswerError
                        error={error.toString()}
                        onRetry={() => makeApiRequest(lastQuestionRef.current)}
                    />
                    </div>
                </>
                ) : null}
                <div ref={chatMessageStreamEnd} />
            </div>
            )}

            <div className={styles.chatInput}>
            <QuestionInput
                clearOnSend
                placeholder="Type a new question."
                disabled={isLoading}
                onSend={question => makeApiRequest(question)}
            />
            </div>
        </div>

        {answers.length > 0 && activeAnalysisPanelTab && (
            <AnalysisPanel
            className={styles.chatAnalysisPanel}
            activeCitation={activeCitation}
            onActiveTabChanged={x => onToggleTab(x, selectedAnswer)}
            answer={answers[selectedAnswer][1]}
            activeTab={activeAnalysisPanelTab}
            onCitationClicked={c => onShowCitation(c, selectedAnswer)}
            togglePanelExpansion={togglePanelExpansion}
            isExpanded={isAnalysisPanelExpanded}
            />
        )}

        <Panel
            headerText="Configure answer generation"
            isOpen={isConfigPanelOpen}
            isBlocking={false}
            onDismiss={() => setIsConfigPanelOpen(false)}
            closeButtonAriaLabel="Close"
            onRenderFooterContent={() => (
            <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>
                Close
            </DefaultButton>
            )}
            isFooterAtBottom={true}
        >
            <TextField
            className={styles.chatSettingsSeparator}
            defaultValue={promptTemplate}
            label="Override prompt template"
            multiline
            autoAdjustHeight
            onChange={onPromptTemplateChange}
            />

            <Slider
            className={styles.chatSettingsSeparator}
            label="Temperature"
            min={0}
            max={1}
            step={0.1}
            defaultValue={temperature}
            onChange={onTemperatureChange}
            showValue
            snapToStep
            />

            <SpinButton
            className={styles.chatSettingsSeparator}
            label="Retrieve this many search results:"
            min={1}
            max={999}
            defaultValue={retrieveCount.toString()}
            onChange={onRetrieveCountChange}
            />
            <TextField
            className={styles.chatSettingsSeparator}
            label="Exclude category"
            onChange={onExcludeCategoryChanged}
            />

            {showSemanticRankerOption && (
            <Checkbox
                className={styles.chatSettingsSeparator}
                checked={useSemanticRanker}
                label="Use semantic ranker for retrieval"
                onChange={onUseSemanticRankerChange}
            />
            )}
            <Checkbox
            className={styles.chatSettingsSeparator}
            checked={useSemanticCaptions}
            label="Use query-contextual summaries instead of whole documents"
            onChange={onUseSemanticCaptionsChange}
            disabled={!useSemanticRanker}
            />
            <Checkbox
            className={styles.chatSettingsSeparator}
            checked={useSuggestFollowupQuestions}
            label="Suggest follow-up questions"
            onChange={onUseSuggestFollowupQuestionsChange}
            />

            {showGPT4VOptions && (
            <GPT4VSettings
                gpt4vInputs={gpt4vInput}
                isUseGPT4V={useGPT4V}
                updateUseGPT4V={useGPT4V => {
                setUseGPT4V(useGPT4V);
                }}
                updateGPT4VInputs={inputs => setGPT4VInput(inputs)}
            />
            )}

            {showVectorOption && (
            <VectorSettings
                retrievalMode={retrievalMode}
                showImageOptions={useGPT4V && showGPT4VOptions}
                updateVectorFields={(options: VectorFieldOptions[]) =>
                setVectorFieldList(options)
                }
                onRetrievalModeChange={onRetrievalModeChange}
            />
            )}

            {useLogin && (
            <Checkbox
                className={styles.chatSettingsSeparator}
                checked={useOidSecurityFilter || requireAccessControl}
                label="Use oid security filter"
                disabled={!isLoggedIn(client) || requireAccessControl}
                onChange={onUseOidSecurityFilterChange}
            />
            )}
            {useLogin && (
            <Checkbox
                className={styles.chatSettingsSeparator}
                checked={useGroupsSecurityFilter || requireAccessControl}
                label="Use groups security filter"
                disabled={!isLoggedIn(client) || requireAccessControl}
                onChange={onUseGroupsSecurityFilterChange}
            />
            )}

            <Checkbox
            className={styles.chatSettingsSeparator}
            checked={shouldStream}
            label="Stream chat completion responses"
            onChange={onShouldStreamChange}
            />
            {useLogin && <TokenClaimsDisplay />}
        </Panel>
        </div>
    </div>
    );
};

export default Chat;
