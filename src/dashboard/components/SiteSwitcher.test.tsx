import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SiteRank } from '@/core/types';

import { SiteSwitcher } from './SiteSwitcher';

const sites: SiteRank[] = Array.from({ length: 12 }, (_, i) => ({
  apexDomain: `site${i}.com`,
  totalVisits: 100 - i,
  activeDays: 10 - i,
}));

describe('SiteSwitcher', () => {
  it('renders tablist with up to 10 chips and aria-selected on the active site', () => {
    render(<SiteSwitcher topSites={sites} selectedApex="site2.com" onSelect={vi.fn()} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(10);
    expect(screen.getByRole('tab', { name: /site2\.com/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('calls onSelect when a chip is activated', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <SiteSwitcher topSites={sites.slice(0, 3)} selectedApex="site0.com" onSelect={onSelect} />,
    );

    await user.click(screen.getByRole('tab', { name: /site1\.com/i }));
    expect(onSelect).toHaveBeenCalledWith('site1.com');
  });

  it('renders nothing when topSites is empty', () => {
    const { container } = render(<SiteSwitcher topSites={[]} selectedApex="" onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
