import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  // ─── Visibility ────────────────────────────────────────────────────

  describe('visibility', () => {
    it('should render nothing when totalPages is 1', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should render nothing when totalPages is 0', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} />
      );
      expect(container.innerHTML).toBe('');
    });

    it('should render navigation when totalPages > 1', () => {
      render(<Pagination currentPage={1} totalPages={5} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  // ─── Button State ──────────────────────────────────────────────────

  describe('button state', () => {
    it('should disable "previous" button on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} />);

      const prevButton = screen.getByLabelText('prev');
      expect(prevButton).toBeDisabled();
    });

    it('should disable "next" button on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} />);

      const nextButton = screen.getByLabelText('next');
      expect(nextButton).toBeDisabled();
    });

    it('should enable both buttons on a middle page', () => {
      render(<Pagination currentPage={3} totalPages={5} />);

      expect(screen.getByLabelText('prev')).not.toBeDisabled();
      expect(screen.getByLabelText('next')).not.toBeDisabled();
    });
  });

  // ─── Page Number Rendering ─────────────────────────────────────────

  describe('page number rendering', () => {
    it('should show all pages when totalPages is small (e.g. 3)', () => {
      render(<Pagination currentPage={1} totalPages={3} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show ellipsis for large page counts', () => {
      render(<Pagination currentPage={5} totalPages={20} />);

      // Should show: 1, ..., 4, 5, 6, ..., 20
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getAllByText('...').length).toBeGreaterThanOrEqual(1);
    });

    it('should mark current page with aria-current="page"', () => {
      render(<Pagination currentPage={3} totalPages={5} />);

      const currentButton = screen.getByText('3');
      expect(currentButton).toHaveAttribute('aria-current', 'page');
    });

    it('should NOT mark non-current pages with aria-current', () => {
      render(<Pagination currentPage={3} totalPages={5} />);

      const otherButton = screen.getByText('2');
      expect(otherButton).not.toHaveAttribute('aria-current');
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  describe('accessibility', () => {
    it('should have nav element with aria-label', () => {
      render(<Pagination currentPage={1} totalPages={5} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'navLabel');
    });

    it('should have aria-labels on ellipsis buttons', () => {
      render(<Pagination currentPage={10} totalPages={20} />);

      const dots = screen.getAllByText('...');
      dots.forEach((dot) => {
        expect(dot).toHaveAttribute('aria-label', 'more');
      });
    });

    it('should disable ellipsis buttons (not clickable)', () => {
      render(<Pagination currentPage={10} totalPages={20} />);

      const dots = screen.getAllByText('...');
      dots.forEach((dot) => {
        expect(dot).toBeDisabled();
      });
    });
  });
});
