import * as React from 'react';

import { ChevronDown } from '@/components/icons';
import { cn } from '@/lib/utils';

// Native <select> with the same compound API as before (Select > SelectTrigger/SelectContent > SelectItem).
// The compound parts only describe the control; Select reads them and renders one real <select>.
type PartProps = { className?: string; children?: React.ReactNode };
type ItemProps = PartProps & { value: string };

const SelectTrigger = (_: PartProps) => null;
const SelectValue = (_: { placeholder?: string }) => null;
const SelectContent = (_: PartProps) => null;
const SelectItem = (_: ItemProps) => null;

function collectItems(node: React.ReactNode, items: ItemProps[]): void {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<PartProps>(child)) return;
    if (child.type === SelectItem) items.push(child.props as ItemProps);
    else collectItems(child.props.children, items);
  });
}

function Select({ value, onValueChange, disabled, children }: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const items: ItemProps[] = [];
  let triggerClass: string | undefined;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<PartProps>(child)) return;
    if (child.type === SelectTrigger) triggerClass = child.props.className;
    else collectItems(child.props.children, items);
  });

  return (
    <div className={cn('relative flex h-10 w-full items-center rounded-md border border-input bg-background text-sm', triggerClass)}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ colorScheme: 'dark' }}
        className="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {items.map((item) => (
          <option key={item.value} value={item.value} className={item.className}>
            {item.children}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 opacity-50" />
    </div>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
