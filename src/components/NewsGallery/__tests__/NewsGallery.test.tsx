import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsGallery from '../NewsGallery';
import type { Photo } from '@/generated/prisma/client';

function mockPhotos(count: number): Photo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i}`,
    newsId: 'news-1',
    url: `/image${i}.jpg`,
    altText: null,
  })) as Photo[];
}

describe('NewsGallery', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Rendering ─────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render nothing when photos array is empty', () => {
      const { container } = render(<NewsGallery photos={[]} />);
      expect(container.innerHTML).toBe('');
    });

    it('should render thumbnail buttons for each photo', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should render images with correct alt text', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Gallery thumbnail 1');
      expect(images[1]).toHaveAttribute('alt', 'Gallery thumbnail 2');
    });

    it('should have aria-labels with image counter', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      const buttons = screen.getAllByRole('button');
      // Translation mock returns key:params format
      expect(buttons[0]).toHaveAttribute(
        'aria-label',
        'imageCounter:{"current":1,"total":3}'
      );
    });
  });

  // ─── Lightbox ──────────────────────────────────────────────────────

  describe('lightbox', () => {
    it('should open lightbox when clicking a thumbnail', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);

      fireEvent.click(screen.getAllByRole('button')[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show the correct image in lightbox', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);

      // Click second thumbnail
      fireEvent.click(screen.getAllByRole('button')[1]);

      const dialog = screen.getByRole('dialog');
      const lightboxImg = dialog.querySelector('img');
      expect(lightboxImg).toHaveAttribute('src', '/image1.jpg');
    });

    it('should close lightbox when close button is clicked', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);

      // Open
      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close via the close button (aria-label = 'closeGallery')
      const closeButton = screen.getByLabelText('closeGallery');
      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should show navigation buttons when multiple photos exist', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);

      fireEvent.click(screen.getAllByRole('button')[0]);

      expect(screen.getByLabelText('prevImage')).toBeInTheDocument();
      expect(screen.getByLabelText('nextImage')).toBeInTheDocument();
    });

    it('should NOT show navigation buttons for single photo', () => {
      render(<NewsGallery photos={mockPhotos(1)} />);

      fireEvent.click(screen.getByRole('button'));

      expect(screen.queryByLabelText('prevImage')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('nextImage')).not.toBeInTheDocument();
    });
  });

  // ─── Keyboard Navigation ──────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('should close lightbox on Escape key', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);

      fireEvent.click(screen.getAllByRole('button')[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should navigate to next image on ArrowRight', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);

      fireEvent.click(screen.getAllByRole('button')[0]);

      // Counter should show 1/3
      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Counter should now show 2/3
      expect(
        screen.getByText('imageCounter:{"current":2,"total":3}')
      ).toBeInTheDocument();
    });

    it('should navigate to previous image on ArrowLeft', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);

      fireEvent.click(screen.getAllByRole('button')[1]); // Start at index 1

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();
    });

    it('should wrap around from last to first image', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);

      // Open at last image (index 2)
      fireEvent.click(screen.getAllByRole('button')[2]);

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      // Should wrap to first image
      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();
    });
  });

  // ─── Swipe Gestures ───────────────────────────────────────────────

  describe('swipe gestures', () => {
    it('should navigate to next image on swipe left', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      fireEvent.click(screen.getAllByRole('button')[0]);

      fireEvent.touchStart(document, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 30 }] }); // delta = -70

      expect(
        screen.getByText('imageCounter:{"current":2,"total":3}')
      ).toBeInTheDocument();
    });

    it('should navigate to prev image on swipe right', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      fireEvent.click(screen.getAllByRole('button')[1]);

      fireEvent.touchStart(document, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 170 }] }); // delta = 70

      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();
    });

    it('should ignore short swipes', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      fireEvent.click(screen.getAllByRole('button')[0]);

      fireEvent.touchStart(document, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 90 }] }); // delta = -10 (threshold 50)

      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();
    });

    it('should do nothing on touchEnd if touchStart was not fired', () => {
      render(<NewsGallery photos={mockPhotos(3)} />);
      fireEvent.click(screen.getAllByRole('button')[0]);

      fireEvent.touchEnd(document, { changedTouches: [{ clientX: 30 }] });

      // Should still be on the first image
      expect(
        screen.getByText('imageCounter:{"current":1,"total":3}')
      ).toBeInTheDocument();
    });
  });

  // ─── Scroll Locking ───────────────────────────────────────────────

  describe('scroll locking', () => {
    it('should lock body scroll when lightbox is open', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);

      fireEvent.click(screen.getAllByRole('button')[0]);

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when lightbox is closed', () => {
      render(<NewsGallery photos={mockPhotos(2)} />);

      // Open
      fireEvent.click(screen.getAllByRole('button')[0]);
      // Close
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(document.body.style.overflow).not.toBe('hidden');
    });
  });
});
