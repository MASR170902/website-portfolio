document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector("header");
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  // --- Hamburger Menu Functionality ---
  navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
    navMenu.classList.toggle("active");
  });

  // Close menu when a link is clicked
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        navMenu.classList.remove("active");
      }
    });
  });

  // --- Scroll Spy & Padding Update Functionality ---
  const root = document.documentElement;
  const updateScrollPadding = () => {
    const headerHeight = header.offsetHeight;
    root.style.setProperty("scroll-padding-top", headerHeight + "px");
  };

  const resizeObserver = new ResizeObserver(() => {
    updateScrollPadding();
  });
  resizeObserver.observe(header);
  updateScrollPadding();

  // Intersection Observer for scroll spying
  const navObserverOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  const navObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.remove("nav-active");
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("nav-active");
          }
        });
      }
    });
  }, navObserverOptions);

  sections.forEach((section) => {
    navObserver.observe(section);
  });

  // --- Journey Timeline Animation Functionality ---
  const timelineItems = document.querySelectorAll(".timeline-item");

  const timelineObserverOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.2, // Trigger when 20% of the item is visible
  };

  const timelineObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // Stop observing after it has become visible
      }
    });
  }, timelineObserverOptions);

  timelineItems.forEach((item) => {
    timelineObserver.observe(item);
  });
});
