import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SparklesIcon,
  BookOpenIcon,
  LightBulbIcon,
  BoltIcon,
  Squares2X2Icon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  HeartIcon,
  BeakerIcon,
  ListBulletIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { FC } from 'react';

interface IconProps {
  className?: string;
}

export const WisdomIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <AcademicCapIcon className={className} />
);

export const GreetingsIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <ChatBubbleLeftRightIcon className={className} />
);

export const FactsIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <DocumentTextIcon className={className} />
);

export const MotivationalIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <SparklesIcon className={className} />
);

export const SourceIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <BookOpenIcon className={className} />
);

export const IdeationIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <LightBulbIcon className={className} />
);

export const GeneratorIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <BoltIcon className={className} />
);

export const ContentIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <Squares2X2Icon className={className} />
);

export const PublishingIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <PaperAirplaneIcon className={className} />
);

export const SourcingIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <MagnifyingGlassIcon className={className} />
);

export const StatsIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <ChartBarIcon className={className} />
);

export const BenchBossIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <ShieldCheckIcon className={className} />
);

export const CaptainHeartIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <HeartIcon className={className} />
);

export const BoxIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <BeakerIcon className={className} />
);

export const WGenIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <AcademicCapIcon className={className} />
);

export const BoxGenIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <BeakerIcon className={className} />
);

export const FGenIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <DocumentTextIcon className={className} />
);

export const BenchBossGenIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <ShieldCheckIcon className={className} />
);

export const CaptainHeartGenIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <HeartIcon className={className} />
);

export const TriviaSelectorIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <ListBulletIcon className={className} />
);

export const BuildTriviaSetIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <PuzzlePieceIcon className={className} />
);

export const MultipleChoiceIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <CheckCircleIcon className={className} />
);

export const TrueFalseIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <XCircleIcon className={className} />
);

export const WhoAmIIcon: FC<IconProps> = ({ className = 'h-10 w-10' }) => (
  <UserIcon className={className} />
);
