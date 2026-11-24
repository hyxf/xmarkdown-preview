declare module 'markdown-it-container' {
  import type { MarkdownIt, Token } from 'markdown-it';

  interface ContainerOptions {
    render?: (tokens: Token[], index: number) => string;
  }

  const container: (
    markdown: MarkdownIt,
    name: string,
    options?: ContainerOptions,
  ) => void;
  export default container;
}

declare module 'markdown-it-emoji' {
  import type { MarkdownIt } from 'markdown-it';

  export const full: (markdown: MarkdownIt) => void;
}

declare module 'markdown-it-task-lists' {
  import type { MarkdownIt } from 'markdown-it';

  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const taskLists: (markdown: MarkdownIt, options?: TaskListOptions) => void;
  export default taskLists;
}

declare module 'markdown-it-footnote' {
  import type { MarkdownIt } from 'markdown-it';

  const footnote: (markdown: MarkdownIt) => void;
  export default footnote;
}

declare module 'markdown-it-deflist' {
  import type { MarkdownIt } from 'markdown-it';

  const deflist: (markdown: MarkdownIt) => void;
  export default deflist;
}
