// import { Stack, Pivot, PivotItem } from "@fluentui/react";

// import styles from "./AnalysisPanel.module.css";

// import { SupportingContent } from "../SupportingContent";
// import { ChatAppResponse } from "../../api";
// import { AnalysisPanelTabs } from "./AnalysisPanelTabs";
// import { ThoughtProcess } from "./ThoughtProcess";
// import { MarkdownViewer } from "../MarkdownViewer";
// import { useMsal } from "@azure/msal-react";
// import { getHeaders } from "../../api";
// import { useLogin, getToken } from "../../authConfig";
// import { useState, useEffect } from "react";

// interface Props {
//     className: string;
//     activeTab: AnalysisPanelTabs;
//     activeCitation: string;
//     answer: ChatAppResponse;
//     isExpanded: boolean;
//     togglePanelExpansion: () => void;
//     onActiveTabChanged: (tab: AnalysisPanelTabs) => void;
//     onCitationClicked: (filePath: string) => void;
// }

// const pivotItemDisabledStyle = { disabled: true, style: { color: "grey" } };

// export const AnalysisPanel = ({ answer, activeTab, activeCitation, citationHeight, className, onActiveTabChanged, onCitationClicked }: Props) => {
//     const isDisabledThoughtProcessTab: boolean = !answer.choices[0].context.thoughts;
//     const isDisabledSupportingContentTab: boolean = !answer.choices[0].context.data_points;
//     const isDisabledCitationTab: boolean = !activeCitation;
//     const [citation, setCitation] = useState("");

//     const client = useLogin ? useMsal().instance : undefined;

//     const fetchCitation = async () => {
//         const token = client ? await getToken(client) : undefined;
//         if (activeCitation) {
//             // Get hash from the URL as it may contain #page=N
//             // which helps browser PDF renderer jump to correct page N
//             const originalHash = activeCitation.indexOf("#") ? activeCitation.split("#")[1] : "";
//             const response = await fetch(activeCitation, {
//                 method: "GET",
//                 headers: getHeaders(token)
//             });
//             const citationContent = await response.blob();
//             let citationObjectUrl = URL.createObjectURL(citationContent);
//             // Add hash back to the new blob URL
//             if (originalHash) {
//                 citationObjectUrl += "#" + originalHash;
//             }
//             setCitation(citationObjectUrl);
//         }
//     };
//     useEffect(() => {
//         fetchCitation();
//     }, []);

//     const renderFileViewer = () => {
//         if (!activeCitation) {
//             return null;
//         }

//         const fileExtension = activeCitation.split(".").pop()?.toLowerCase();
//         switch (fileExtension) {
//             case "png":
//                 return <img src={citation} className={styles.citationImg} alt="Citation Image" />;
//             case "md":
//                 return <MarkdownViewer src={activeCitation} />;
//             default:
//                 return <iframe title="Citation" src={citation} width="100%" height={citationHeight} />;
//         }
//     };

//     return (
//         <Pivot
//             className={className}
//             selectedKey={activeTab}
//             onLinkClick={pivotItem => pivotItem && onActiveTabChanged(pivotItem.props.itemKey! as AnalysisPanelTabs)}
//         >
//             <PivotItem
//                 itemKey={AnalysisPanelTabs.ThoughtProcessTab}
//                 headerText="Thought process"
//                 headerButtonProps={isDisabledThoughtProcessTab ? pivotItemDisabledStyle : undefined}
//             >
//                 <ThoughtProcess thoughts={answer.choices[0].context.thoughts || []} />
//             </PivotItem>
//             <PivotItem
//                 itemKey={AnalysisPanelTabs.SupportingContentTab}
//                 headerText="Supporting content"
//                 headerButtonProps={isDisabledSupportingContentTab ? pivotItemDisabledStyle : undefined}
//             >
//                 <SupportingContent supportingContent={answer.choices[0].context.data_points} />
//             </PivotItem>
//             <PivotItem
//                 itemKey={AnalysisPanelTabs.CitationTab}
//                 headerText="Citation"
//                 headerButtonProps={isDisabledCitationTab ? pivotItemDisabledStyle : undefined}
//             >
//                 {renderFileViewer()}
//             </PivotItem>
//         </Pivot>
//     );
// };







import { useState, useEffect } from "react";
import axios, { AxiosProgressEvent, AxiosRequestConfig } from "axios";
import { Pivot, PivotItem } from "@fluentui/react";
import { useMsal } from "@azure/msal-react";
import {
    MdKeyboardDoubleArrowLeft,
    MdKeyboardDoubleArrowRight
} from "react-icons/md";

import styles from "./AnalysisPanel.module.css";

import { SupportingContent } from "../SupportingContent";
import { ChatAppResponse } from "../../api";
import { AnalysisPanelTabs } from "./AnalysisPanelTabs";
import { ThoughtProcess } from "./ThoughtProcess";
import { getHeaders } from "../../api";
import { useLogin, getToken } from "../../authConfig";
// import { LoadingBar } from "../LoadingBar";

interface Props {
    className: string;
    activeTab: AnalysisPanelTabs;
    activeCitation: string;
    answer: ChatAppResponse;
    isExpanded: boolean;
    togglePanelExpansion: () => void;
    onActiveTabChanged: (tab: AnalysisPanelTabs) => void;
    onCitationClicked: (filePath: string) => void;
}

const pivotItemDisabledStyle = { disabled: true, style: { color: "grey" } };
const pivotItemDefaultStyle = {
    linkIsSelected: {
        selectors: {
            ":before": {
                background: "#000000"
            }
        }
    }
};

export const AnalysisPanel = ({
    answer,
    activeTab,
    activeCitation,
    className,
    isExpanded,
    togglePanelExpansion,
    onActiveTabChanged,
    onCitationClicked
}: Props) => {
    const isDisabledThoughtProcessTab: boolean =
        !answer.choices[0].context.thoughts;
    const isDisabledSupportingContentTab: boolean =
        !answer.choices[0].context.data_points;
    const isDisabledCitationTab: boolean = !activeCitation;

    const [citationURL, setCitationURL] = useState("");
    const [downloadProgress, setDownloadProgress] = useState(7);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    const [fileFormat, setFileFormat] = useState("pdf");

    const client = useLogin ? useMsal().instance : undefined;
    const fileIsNotPDF = fileFormat !== "pdf";

    const fetchCitation = async () => {
    localStorage.setItem(`fetched_${activeCitation}`, "true");

    const token = client ? await getToken(client) : undefined;

    if (activeCitation) {
      // const filename = activeCitation.substring(
      //   activeCitation.lastIndexOf("/") + 1
      // );
      // console.log("filename:", filename);

      // const encodedFilename = encodeURIComponent(filename); // Encode filename
      // console.log("encodedFilename:", encodedFilename);

      // const config: AxiosRequestConfig = {
      //   headers: {
      //     ...getHeaders(token),
      //     "Content-Disposition": `attachment; filename="${encodedFilename}"`
      //   },
      //   responseType: "blob",
      //   onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
      //     const percentCompleted = Math.round(
      //       (progressEvent.loaded * 100) / (progressEvent.total || 1)
      //     );

      //     setDownloadProgress(percentCompleted);
      //   }
      // };
        setHasDownloaded(false);

        const config: AxiosRequestConfig = {
            headers: getHeaders(token),
            responseType: "blob",
            onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );

            setDownloadProgress(percentCompleted);
            }
        };

      // Get hash from the URL as it may contain #page=N
      // which helps browser PDF renderer jump to correct page N
        const [baseURL, hash = ""] = activeCitation.split("#");
        console.log("baseURL:", baseURL);
        console.log("hash:", hash);

        const lastPartOfCitationUrl = baseURL.slice(baseURL.lastIndexOf(".") + 1);
        console.log("lastPartOfCitationUrl:", lastPartOfCitationUrl);

        setFileFormat(lastPartOfCitationUrl);

        const response = await axios.get(activeCitation, config);
        console.log("response:", response);

        const citationContent = response.data;
        console.log("citationContent:", citationContent);

        const blob = new Blob([citationContent], {
            type: response.headers["content-type"]
        });
        console.log("blob:", blob);

        // let citationObjectUrl = URL.createObjectURL(citationContent);
        let citationObjectUrl = URL.createObjectURL(blob);
        console.log("citationObjectUrl:", citationObjectUrl);

        // Add hash back to the new blob URL
        if (hash) {
            citationObjectUrl += `#${hash}`;
        }

      // setCitation(citationObjectUrl);
      // console.log("citationObjectUrl:", citationObjectUrl);

      // // Create a temporary link to trigger download
      // const tempLink = document.createElement("a");
      // tempLink.href = citationObjectUrl;
      // tempLink.setAttribute("download", filename);
      // tempLink.click();

      // // Create a temporary link to trigger download
      // const tempLink = document.createElement("a");
      // tempLink.href = citationObjectUrl;
      // tempLink.setAttribute("download", filename);
      // tempLink.style.display = "none"; // Hide the link

      // // document.body.appendChild(tempLink); // Append link to the body
      // // tempLink.click(); // Click the link
      // // URL.revokeObjectURL(citationObjectUrl); // Clean up object URL
      // // document.body.removeChild(tempLink); // Remove link from the body

      // // Ensure document is fully loaded before accessing it
      // if (document.readyState === "complete") {
      //   document.body.appendChild(tempLink); // Append link to the body
      //   tempLink.click(); // Click the link
      //   URL.revokeObjectURL(citationObjectUrl); // Clean up object URL
      //   document.body.removeChild(tempLink); // Remove link from the body
      // } else {
      //   // If document is not fully loaded, wait for the load event
      //   document.addEventListener("DOMContentLoaded", () => {
      //     document.body.appendChild(tempLink); // Append link to the body
      //     tempLink.click(); // Click the link
      //     URL.revokeObjectURL(citationObjectUrl); // Clean up object URL
      //     document.body.removeChild(tempLink); // Remove link from the body
      //   });
      // }
        setCitationURL(citationObjectUrl);
        setHasDownloaded(true);
    }
};

    function removeContentPath(contentPath: string) {
        return contentPath.replace(/\/content\//, "");
    }

    useEffect(() => {
        const citationFetched = localStorage.getItem(`fetched_${activeCitation}`);
        if (!citationFetched && activeCitation) {
        fetchCitation();
        }
    }, [activeCitation]);

    useEffect(() => {
        if (fileIsNotPDF && hasDownloaded && citationURL) {
        const anchor = document.createElement("a");
        anchor.href = citationURL;
        anchor.download = removeContentPath(activeCitation);
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setHasDownloaded(false);
        }
    }, [citationURL]);

    return (
        <div className={`${className} ${isExpanded && styles.expandedPanel}`}>
            <button className={styles.expansionButton} onClick={togglePanelExpansion}>
                {isExpanded ? (
                <>
                    <MdKeyboardDoubleArrowRight size={26} />
                    Collapse
                </>
                ) : (
                <>
                    <MdKeyboardDoubleArrowLeft size={26} />
                    Expand
                </>
                )}
            </button>
            <Pivot
                className={`${className} ${isExpanded && styles.expandedPanel}`}
                styles={pivotItemDefaultStyle}
                selectedKey={activeTab}
                onLinkClick={pivotItem =>
                pivotItem &&
                onActiveTabChanged(pivotItem.props.itemKey! as AnalysisPanelTabs)
                }
            >
                <PivotItem
                itemKey={AnalysisPanelTabs.ThoughtProcessTab}
                headerText="Thought process"
                headerButtonProps={
                    isDisabledThoughtProcessTab ? pivotItemDisabledStyle : undefined
                }
                >
                <ThoughtProcess thoughts={answer.choices[0].context.thoughts || []} />
                </PivotItem>
                <PivotItem
                itemKey={AnalysisPanelTabs.SupportingContentTab}
                headerText="Supporting content"
                headerButtonProps={
                    isDisabledSupportingContentTab ? pivotItemDisabledStyle : undefined
                }
                >
                <SupportingContent
                    supportingContent={answer.choices[0].context.data_points}
                    onClickOnContentTitle={onCitationClicked}
                />
                </PivotItem>
                <PivotItem
                className={styles.citationContainer}
                itemKey={AnalysisPanelTabs.CitationTab}
                headerText="Citation"
                headerButtonProps={
                    isDisabledCitationTab ? pivotItemDisabledStyle : undefined
                }
                >
                {/* {fileIsNotPDF && <LoadingBar progress={downloadProgress} />} */}
                {activeCitation?.endsWith(".png") ? (
                    <img src={citationURL} className={styles.citationImg} />
                ) : (
                    <>
                    <iframe
                        title="Citation"
                        src={fileIsNotPDF ? "" : citationURL}
                        width="100%"
                        height="100%"
                    />
                    </>
                )}
                </PivotItem>
            </Pivot>
            </div>
        );
};
