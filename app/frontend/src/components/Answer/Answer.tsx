import { useMemo, useState } from "react";
import { Stack, IconButton } from "@fluentui/react";
import DOMPurify from "dompurify";
import axios from "axios";
import { ChatAppResponse, getCitationFilePath } from "../../api";
import { parseAnswerToHtml } from "./AnswerParser";

import styles from "./Answer.module.css";
import { QuestionInput } from "../QuestionInput";

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
