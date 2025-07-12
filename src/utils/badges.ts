export interface Badge {
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: number;
}

export const badges: Badge[] = [
  {
    name: 'Newcomer',
    description: 'Welcome to the community!',
    icon: '🌟',
    color: 'bg-gray-500',
    requirement: 0
  },
  {
    name: 'Helper',
    description: 'Answered 5 questions',
    icon: '🤝',
    color: 'bg-blue-500',
    requirement: 5
  },
  {
    name: 'Contributor',
    description: 'Answered 15 questions',
    icon: '💡',
    color: 'bg-green-500',
    requirement: 15
  },
  {
    name: 'Expert',
    description: 'Answered 50 questions',
    icon: '🎯',
    color: 'bg-purple-500',
    requirement: 50
  },
  {
    name: 'Master',
    description: 'Answered 100 questions',
    icon: '👑',
    color: 'bg-yellow-500',
    requirement: 100
  },
  {
    name: 'Legend',
    description: 'Answered 250 questions',
    icon: '🏆',
    color: 'bg-red-500',
    requirement: 250
  }
];

export const getBadgeForAnswerCount = (answerCount: number): Badge => {
  const sortedBadges = badges.sort((a, b) => b.requirement - a.requirement);
  return sortedBadges.find(badge => answerCount >= badge.requirement) || badges[0];
};

export const getNextBadge = (answerCount: number): Badge | null => {
  const sortedBadges = badges.sort((a, b) => a.requirement - b.requirement);
  return sortedBadges.find(badge => answerCount < badge.requirement) || null;
};