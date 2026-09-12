declare module 'react-vertical-timeline-component' {
  import { FC, CSSProperties, ReactNode } from 'react';

  export interface VerticalTimelineProps {
    animate?: boolean;
    className?: string;
    layout?: '1-column-left' | '1-column' | '2-columns';
    lineColor?: string;
    children?: ReactNode;
  }

  export interface VerticalTimelineElementProps {
    className?: string;
    contentArrowStyle?: CSSProperties;
    contentStyle?: CSSProperties;
    date?: string;
    dateClassName?: string;
    icon?: ReactNode;
    iconClassName?: string;
    iconOnClick?: () => void;
    iconStyle?: CSSProperties;
    id?: string;
    intersectionObserverProps?: any;
    onTimelineElementClick?: () => void;
    position?: string;
    style?: CSSProperties;
    textClassName?: string;
    visible?: boolean;
    children?: ReactNode;
  }

  export const VerticalTimeline: FC<VerticalTimelineProps>;
  export const VerticalTimelineElement: FC<VerticalTimelineElementProps>;
}

declare module 'react-vertical-timeline-component/style.min.css';
