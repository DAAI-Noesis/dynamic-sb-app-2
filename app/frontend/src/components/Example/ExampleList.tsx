import { USE_CASES } from "../../helpers/constants";
import { Example } from "./Example";

import styles from "./Example.module.css";

const DEFAULT_EXAMPLES = {
  [USE_CASES.THEME_1]: [
    "Os infoobjects que são específicos de determinada aplicação devem ficar inseridos dentro ou fora da respetiva Infoarea?",
    "Quais são as considerações base?",
    "Quais são os modelos a implementar?",
  ],
  [USE_CASES.THEME_2]: [
    "",
    "",
    ""
  ],
  [USE_CASES.THEME_3]: [
    "",
    "",
    ""
  ],
  [USE_CASES.THEME_4]: [
    "",
    "",
    ""
  ],
  [USE_CASES.THEME_5]: [
    "",
    "",
    ""
  ],
  [USE_CASES.THEME_6]: [
    "",
    "",
    ""
  ]
};

const GPT4V_EXAMPLES: string[] = [
  "Compare the impact of interest rates and GDP in financial markets.",
  "What is the expected trend for the S&P 500 index over the next five years? Compare it to the past S&P 500 performance",
  "Can you identify any correlation between oil prices and stock market trends?"
];

interface Props {
  onExampleClicked: (value: string) => void;
  useGPT4V?: boolean;
  activeUseCase: USE_CASES;
}

export const ExampleList = ({
  onExampleClicked,
  useGPT4V,
  activeUseCase
}: Props) => {
  return (
    <ul className={styles.examplesNavList}>
      {(useGPT4V ? GPT4V_EXAMPLES : DEFAULT_EXAMPLES[activeUseCase]).map(
        (question, i) => (
          <li key={i}>
            <Example
              text={question}
              value={question}
              onClick={onExampleClicked}
            />
          </li>
        )
      )}
    </ul>
  );
};
