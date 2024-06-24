import { useMemo, useState } from "react";
import { Stack, IconButton, TextField, DefaultButton } from "@fluentui/react";
import DOMPurify from "dompurify";
import axios from "axios";
import { ChatAppResponse, getCitationFilePath } from "../../api";
import { parseAnswerToHtml } from "./AnswerParser";

import styles from "./Answer.module.css";

interface Props {
  answer: ChatAppResponse;
  isSelected?: boolean;
  isStreaming: boolean;
  onCitationClicked: (filePath: string) => void;
  onThoughtProcessClicked: () => void;
  onSupportingContentClicked: () => void;
  onFollowupQuestionClicked?: (question: string) => void;
  showFollowupQuestions?: boolean;
  isLastAnswer: boolean;
}

export const Answer = ({
  answer,
  isSelected,
  isStreaming,
  onCitationClicked,
  onThoughtProcessClicked,
  onSupportingContentClicked,
  onFollowupQuestionClicked,
  showFollowupQuestions,
  isLastAnswer
}: Props) => {
  const followupQuestions = answer.choices[0].context.followup_questions;
  const messageContent = answer.choices[0].message.content;
  const parsedAnswer = useMemo(
    () => parseAnswerToHtml(messageContent, isStreaming, onCitationClicked),
    [answer, isStreaming, onCitationClicked, messageContent]
  );

  let sanitizedAnswerHtml = DOMPurify.sanitize(parsedAnswer.answerHtml);

  if (isStreaming && isLastAnswer) {
    sanitizedAnswerHtml += `<span class="${styles.loadingdots}" />`;
  }

  const [userQuestion, setUserQuestion] = useState("");
  const [liked, setLiked] = useState(false); // State to track like button click

  const sendFeedback = async (feedback: boolean) => {
    const feedbackData = {
      BotMessage: messageContent,
      UserFeedback: feedback,
      UserQuestion: userQuestion // Include user question in feedback data
    };

    const jsonData = JSON.stringify(feedbackData);

    try {
      const response = await axios.post("http://localhost:7071/api/Feedback_insert", jsonData);
      console.log("Feedback submitted:", response.data);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <Stack className={`${styles.answerContainer} ${isSelected ? styles.selected : ""}`} verticalAlign="space-between">
      <Stack.Item>
        <Stack horizontal horizontalAlign="space-between">
          <div>
            <IconButton
              style={{ color: "black" }}
              iconProps={{ iconName: "Lightbulb" }}
              title="Show thought process"
              ariaLabel="Show thought process"
              onClick={onThoughtProcessClicked}
              disabled={!answer.choices[0].context.thoughts?.length}
            />
            <IconButton
              style={{ color: "black" }}
              iconProps={{ iconName: "ClipboardList" }}
              title="Show supporting content"
              ariaLabel="Show supporting content"
              onClick={onSupportingContentClicked}
              disabled={!answer.choices[0].context.data_points}
            />
          </div>
        </Stack>
      </Stack.Item>

      <Stack.Item grow className={styles.answerTextContainer}>
        <div className={styles.answerText} dangerouslySetInnerHTML={{ __html: sanitizedAnswerHtml }}></div>
      </Stack.Item>

      {!!parsedAnswer.citations.length && (
        <Stack.Item>
          <Stack horizontal wrap tokens={{ childrenGap: 5 }} verticalAlign="center">
            <span className={styles.citationLearnMore}>Citations:</span>
            {parsedAnswer.citations.map((x, i) => {
              const path = getCitationFilePath(x);
              return (
                <a key={i} className={styles.citation} title={x} onClick={() => onCitationClicked(path)}>
                  {`${++i}. ${x}`}
                </a>
              );
            })}
            <IconButton
              iconProps={{
                iconName: "Like",
                style: {
                  color: liked ? 'blue' : 'black' // Change icon color to blue when liked
                }
              }}
              title="Like"
              ariaLabel="Like"
              onClick={() => {
                sendFeedback(true);
                setLiked(true); // Update state to indicate button clicked
              }}
              styles={{
                root: {
                  marginLeft: 'auto',
                  backgroundColor: 'transparent', // Ensure background is transparent or as needed
                  selectors: {
                    ':hover': {
                      backgroundColor: 'transparent' // Optional: Handle hover styles if needed
                    }
                  }
                }
              }}
            />
            <IconButton
              iconProps={{ iconName: "Dislike" }}
              title="Dislike"
              ariaLabel="Dislike"
              onClick={() => sendFeedback(false)}
            />
          </Stack>
        </Stack.Item>
      )}

      {!!followupQuestions?.length && showFollowupQuestions && onFollowupQuestionClicked && (
        <Stack.Item>
          <Stack horizontal wrap className={`${parsedAnswer.citations.length ? styles.followupQuestionsList : ""}`} tokens={{ childrenGap: 6 }}>
            <span className={styles.followupQuestionLearnMore}>Follow-up questions:</span>
            {followupQuestions.map((x, i) => (
              <a key={i} className={styles.followupQuestion} title={x} onClick={() => onFollowupQuestionClicked(x)}>
                {`${x}`}
              </a>
            ))}
          </Stack>
        </Stack.Item>
      )}
      </Stack>
  );
};
