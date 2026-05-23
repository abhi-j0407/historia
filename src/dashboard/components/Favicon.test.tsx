import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Favicon } from './Favicon';

describe('Favicon', () => {
  it('renders img with the Google favicon proxy URL for the apex', () => {
    const { container } = render(<Favicon apex="example.com" size={32} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute(
      'src',
      'https://www.google.com/s2/favicons?domain=example.com&sz=32',
    );
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('referrerPolicy', 'no-referrer');
  });

  it('switches to letter-tile fallback after img onError', () => {
    const { container } = render(<Favicon apex="missing.test" size={16} />);
    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
