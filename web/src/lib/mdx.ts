import type { MDXRemoteProps } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

// Case studies are trusted, in-repo MDX. Disable next-mdx-remote's generic JS
// expression stripping so JSX expression props (chart={...}, stats={[...]})
// survive compilation. blockDangerousJS remains enabled by default.
export const caseMdxOptions: NonNullable<MDXRemoteProps['options']> = {
  blockJS: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};
