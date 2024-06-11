import { USE_CASES } from "../../helpers/constants";
import { Example } from "./Example";

import styles from "./Example.module.css";

const DEFAULT_EXAMPLES = {
  [USE_CASES.THEME_1]: [
    "Do we have a CISO?",
    "What are the steps we're taking on sustainability?",
    "A PLMJ tem uma certificação ISO 27001?"
  ],
  [USE_CASES.THEME_2]: [
    "What are the 10 biggest transactions of 2022?",
    "What is the Real Estate practice best known for?",
    "Com que clientes trabalha o Diogo Duarte Campos?"
  ],
  [USE_CASES.THEME_3]: [
    "Do we have a CISO?",
    "What are the steps we're taking on sustainability?",
    "A PLMJ tem uma certificação ISO 27001?"
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
