import { USE_CASES } from "../../helpers/constants";
import { Example } from "./Example";

import styles from "./Example.module.css";

const DEFAULT_EXAMPLES = {
  [USE_CASES.THEME_1]: [
    "Qual e o objetivo principal do AT?",
    "Quais foram os objetivos do projeto piloto em 2024 ? ",
    "Quais são os indicadores de performance do projeto ? ",
  ],
  [USE_CASES.THEME_2]: [
    "Qual é o objetivo do Projeto Stock Outs?",
    "Como funciona o processamento dos dados?",
    "Quais são os KPIs do porjeto?"
  ],
  [USE_CASES.THEME_3]: [
    "No projeto Phelps , qual é a fonte , qual os dados e para que é que são usados",
    "Onde posso encontrar o dashboard Phelps?",
    "Quais são os temas abertos ? "
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
