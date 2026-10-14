import type { Locale } from '@/i18n/routing';

export type Localized<T> = Record<Locale, T>;

export type TimelineEntry = {
  company: string;
  role: Localized<string>;
  period: Localized<string>;
  location: Localized<string>;
  summary: Localized<string[]>;
  stack: string[];
};

export const timeline: TimelineEntry[] = [
  {
    company: 'Wellhub',
    role: {
      en: 'Senior Software Engineer',
      pt: 'Engenheiro de Software Sênior',
    },
    period: { en: '2024 — present', pt: '2024 — atual' },
    location: { en: 'Remote', pt: 'Remoto' },
    summary: {
      en: [
        'Lead the technical side of an applied-AI platform that turns 300k+ support tickets per month into executive insight for leadership.',
        'Own a GCP batch-inference pipeline that classifies tickets with Gemini, generates reports with Claude and streams analyzed data to the datalake through Kafka.',
        'Designed the anonymization layer (Microsoft Presidio + spaCy) so personally identifiable information never reaches the models or the analytics layer.',
        'Part of the squad responsible for the service platform other product teams build on.',
      ],
      pt: [
        'Lidero tecnicamente uma plataforma de IA aplicada que transforma 300 mil+ tickets de suporte por mês em insight executivo para a liderança.',
        'Responsável por um pipeline de batch inference no GCP que classifica tickets com Gemini, gera relatórios com Claude e envia os dados analisados ao datalake via Kafka.',
        'Projetei a camada de anonimização (Microsoft Presidio + spaCy) para que dados pessoais nunca cheguem aos modelos nem à camada analítica.',
        'Parte do squad responsável pela plataforma de serviços usada pelos times de produto.',
      ],
    },
    stack: ['GCP', 'Kafka', 'LLM pipelines', 'Data anonymization'],
  },
  {
    company: 'Creditas',
    role: {
      en: 'Software Engineer',
      pt: 'Engenheiro de Software',
    },
    period: { en: '2022 — 2024', pt: '2022 — 2024' },
    location: { en: 'Bauru, SP, Brazil', pt: 'Bauru, SP, Brasil' },
    summary: {
      en: [
        'Built high-availability microservices for banking products with Java 17, Kotlin and Spring Boot/WebFlux.',
        'Operated workloads on AWS and Kubernetes with Terraform-managed infrastructure and CI/CD through CircleCI and GitHub Actions.',
        'Kept the reliability bar with New Relic and Datadog, reviewing the impact of every delivery.',
      ],
      pt: [
        'Desenvolvi microsserviços de alta disponibilidade para produtos bancários com Java 17, Kotlin e Spring Boot/WebFlux.',
        'Operei workloads em AWS e Kubernetes com infraestrutura gerenciada por Terraform e CI/CD via CircleCI e GitHub Actions.',
        'Mantive o padrão de confiabilidade com New Relic e Datadog, analisando o impacto de cada entrega.',
      ],
    },
    stack: ['Kotlin', 'Java 17', 'Spring Boot', 'AWS', 'Kubernetes', 'Terraform'],
  },
  {
    company: 'Matera',
    role: {
      en: 'Software Developer Analyst',
      pt: 'Analista Desenvolvedor',
    },
    period: { en: '2020 — 2022', pt: '2020 — 2022' },
    location: { en: 'Bauru, SP, Brazil', pt: 'Bauru, SP, Brasil' },
    summary: {
      en: [
        'Developed high-availability banking systems in Java 11+ with Spring Boot and MySQL.',
        'Integrated messaging through SQS and RabbitMQ; containerized services with Docker and operated on AWS.',
      ],
      pt: [
        'Desenvolvi sistemas bancários de alta disponibilidade em Java 11+ com Spring Boot e MySQL.',
        'Integrei mensageria com SQS e RabbitMQ; containerizei serviços com Docker e operei na AWS.',
      ],
    },
    stack: ['Java', 'Spring Boot', 'AWS', 'RabbitMQ', 'Docker'],
  },
  {
    company: 'Finch Soluções',
    role: {
      en: 'Software Developer Analyst',
      pt: 'Analista Desenvolvedor',
    },
    period: { en: '2018 — 2020', pt: '2018 — 2020' },
    location: { en: 'Bauru, SP, Brazil', pt: 'Bauru, SP, Brasil' },
    summary: {
      en: [
        'Built RPA automations for the legal market with Java 8+, Selenium and HtmlUnit.',
        'Persistence with JPA over MongoDB and SQL Server.',
      ],
      pt: [
        'Construí automações (RPA) para o mercado jurídico com Java 8+, Selenium e HtmlUnit.',
        'Persistência com JPA sobre MongoDB e SQL Server.',
      ],
    },
    stack: ['Java', 'RPA', 'Selenium', 'MongoDB'],
  },
  {
    company: 'Grupo Multicobra',
    role: {
      en: 'Developer & IT support',
      pt: 'Desenvolvedor & suporte de TI',
    },
    period: { en: '2014 — 2018', pt: '2014 — 2018' },
    location: { en: 'Bauru, SP, Brazil', pt: 'Bauru, SP, Brasil' },
    summary: {
      en: [
        'Three-year progression from IT support technician to developer, building internal systems.',
      ],
      pt: [
        'Progressão de três anos de técnico de suporte a desenvolvedor, construindo sistemas internos.',
      ],
    },
    stack: ['Java', 'SQL'],
  },
];

export const education: { school: string; detail: Localized<string>; period: string }[] = [
  {
    school: 'Faculdade de Tecnologia de Bauru (FATEC)',
    detail: {
      en: 'Database Technology degree',
      pt: 'Graduação em Tecnologia em Banco de Dados',
    },
    period: '2017 – 2019',
  },
  {
    school: 'UNESP — Universidade Estadual Paulista',
    detail: {
      en: 'Computer Science (incomplete)',
      pt: 'Ciência da Computação (não concluído)',
    },
    period: '2014 – 2017',
  },
];

export const skillGroups: { label: Localized<string>; items: string[] }[] = [
  {
    label: { en: 'Languages', pt: 'Linguagens' },
    items: ['Go', 'Kotlin', 'Java', 'TypeScript', 'Node.js'],
  },
  {
    label: { en: 'Platform & delivery', pt: 'Plataforma & entrega' },
    items: ['Kubernetes', 'ArgoCD', 'Helm', 'Terraform', 'AWS', 'GCP', 'GitHub Actions'],
  },
  {
    label: { en: 'Data & messaging', pt: 'Dados & mensageria' },
    items: ['PostgreSQL', 'MongoDB', 'DynamoDB', 'Redis', 'Kafka', 'RabbitMQ', 'SQL Server'],
  },
  {
    label: { en: 'Observability', pt: 'Observabilidade' },
    items: ['OpenTelemetry', 'Prometheus', 'Grafana', 'Loki', 'Tempo', 'Datadog', 'New Relic'],
  },
  {
    label: { en: 'Practices', pt: 'Práticas' },
    items: ['CI/CD', 'Testing', 'DDD', 'Clean architecture', 'Code review'],
  },
];

export const languages: { name: Localized<string>; level: Localized<string> }[] = [
  {
    name: { en: 'Portuguese', pt: 'Português' },
    level: { en: 'Native', pt: 'Nativo' },
  },
  {
    name: { en: 'English', pt: 'Inglês' },
    level: { en: 'Professional', pt: 'Profissional' },
  },
];
