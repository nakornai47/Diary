import React from 'react';
import { Chip, useTheme } from 'react-native-paper';
import { Category, Priority } from '../../models';

interface CategoryChipProps {
  category?: Category | null;
  priority?: Priority | null;
  compact?: boolean;
}

export default function CategoryChip({ category, priority, compact }: CategoryChipProps) {
  const theme = useTheme();

  if (priority && !category) {
    return (
      <Chip
        compact={compact}
        style={{ backgroundColor: priority.color + '22', marginRight: 4 }}
        textStyle={{ color: priority.color, fontSize: 10 }}
      >
        {priority.name}
      </Chip>
    );
  }

  if (!category) return null;

  return (
    <Chip
      compact={compact}
      style={{ backgroundColor: category.color + '22', marginRight: 4 }}
      textStyle={{ color: category.color, fontSize: 10 }}
      icon={category.icon as any}
    >
      {category.name}
    </Chip>
  );
}
