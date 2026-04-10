import './SiteFooter.css';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-footer-title">Smart Campus Operations Hub</span>
          <p className="site-footer-tagline">
            University facilities, bookings, and maintenance in one place.
          </p>
        </div>
        <nav className="site-footer-nav" aria-label="Footer">
          <a href="https://www.sliit.lk/" target="_blank" rel="noopener noreferrer">
            SLIIT
          </a>
          <span className="site-footer-dot" aria-hidden="true">
            {'\u00B7'}
          </span>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Coming soon"
          >
            Support
          </a>
          <span className="site-footer-dot" aria-hidden="true">
            {'\u00B7'}
          </span>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Coming soon"
          >
            Privacy
          </a>
        </nav>
        <div className="site-footer-meta">
          <p>
            &copy; {year} IT3030 PAF &middot; Smart Campus Group 147. All rights reserved.
          </p>
          <p className="site-footer-oauth">Authentication uses Google OAuth 2.0.</p>
        </div>
      </div>
    </footer>
  );
}
