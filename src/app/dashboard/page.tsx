import ActionPanel from '@/components/dashboard/ActionPanel';
import {
  WisdomIcon,
  GreetingsIcon,
  FactsIcon,
  MotivationalIcon,
  SourceIcon,
  IdeationIcon,
  GeneratorIcon,
  ContentIcon,
  PublishingIcon,
  SourcingIcon,
  StatsIcon,
  BenchBossIcon,
  CaptainHeartIcon,
  BoxIcon,
  WGenIcon,
  BoxGenIcon,
  FGenIcon,
  BenchBossGenIcon,
  CaptainHeartGenIcon,
  TriviaSelectorIcon,
  BuildTriviaSetIcon,
  MultipleChoiceIcon,
  TrueFalseIcon,
  WhoAmIIcon,
} from '@/components/dashboard/ActionIcons';

const actionItems = [
  {
    title: 'Wisdom',
    href: '/wisdom',
    icon: <WisdomIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Greetings',
    href: '/greetings',
    icon: <GreetingsIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Facts',
    href: '/facts',
    icon: <FactsIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Motivational',
    href: '/motivational',
    icon: <MotivationalIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Source Updater',
    href: '/source-content-updater',
    icon: <SourceIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Ideation',
    href: '/ideation',
    icon: <IdeationIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Generator',
    href: '/main-generator',
    icon: <GeneratorIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Content Browser',
    href: '/content-browser',
    icon: <ContentIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Publishing',
    href: '/publishing',
    icon: <PublishingIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Sourcing',
    href: '/sourcing',
    icon: <SourcingIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Stats',
    href: '/stats',
    icon: <StatsIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Bench Boss',
    href: '/bench-boss',
    icon: <BenchBossIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Captain Heart',
    href: '/captain-heart',
    icon: <CaptainHeartIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'The Box',
    href: '/pbp',
    icon: <BoxIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'W-Gen',
    href: '/w-gen',
    icon: <WGenIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Box Gen',
    href: '/pbp-gen',
    icon: <BoxGenIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'F-Gen',
    href: '/f-gen',
    icon: <FGenIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Bench Boss Gen',
    href: '/bench-gen',
    icon: <BenchBossGenIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Captain Heart Gen',
    href: '/captain-heart-gen',
    icon: <CaptainHeartGenIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Trivia Selector',
    href: '/trivia-selector',
    icon: <TriviaSelectorIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Build Trivia Set',
    href: '/process-builders/build-trivia-set',
    icon: <BuildTriviaSetIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Multiple Choice',
    href: '/trivia-multiple-choice',
    icon: <MultipleChoiceIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'True/False',
    href: '/trivia-true-false',
    icon: <TrueFalseIcon className="h-10 w-10 text-primary-brand" />,
  },
  {
    title: 'Who Am I',
    href: '/trivia-who-am-i',
    icon: <WhoAmIIcon className="h-10 w-10 text-primary-brand" />,
  },
];

export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Hello
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Welcome to your dashboard
        </p>
      </div>
      <ActionPanel actions={actionItems} />
    </div>
  );
}
