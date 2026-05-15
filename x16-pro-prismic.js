(function () {
  var roots = document.querySelectorAll("[data-asx16-lp]");

  if (!roots.length) {
    return;
  }

  var prefersReducedMotion = false;

  if (window.matchMedia) {
    prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  roots.forEach(function (root) {
    root.classList.add("asx16-is-enhanced");

    var carousels = root.querySelectorAll("[data-asx16-carousel]");

    carousels.forEach(function (carousel) {
      var track = carousel.querySelector("[data-asx16-track]");
      var prev = carousel.querySelector("[data-asx16-prev]");
      var next = carousel.querySelector("[data-asx16-next]");
      var dotsWrap = carousel.querySelector("[data-asx16-dots]");

      if (!track) {
        return;
      }

      var slides = Array.prototype.slice.call(track.children);

      if (!slides.length) {
        return;
      }

      var dots = [];

      if (dotsWrap) {
        dotsWrap.innerHTML = "";

        slides.forEach(function (_, index) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "asx16-carousel__dot";
          dot.setAttribute("aria-label", "Go to slide " + (index + 1));

          dot.addEventListener("click", function () {
            scrollToSlide(index);
          });

          dotsWrap.appendChild(dot);
          dots.push(dot);
        });
      }

      function getActiveIndex() {
        var trackLeft = track.getBoundingClientRect().left;
        var nearestIndex = 0;
        var nearestDistance = Infinity;

        slides.forEach(function (slide, index) {
          var distance = Math.abs(slide.getBoundingClientRect().left - trackLeft);

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        return nearestIndex;
      }

      function setActive(index) {
        dots.forEach(function (dot, dotIndex) {
          if (dotIndex === index) {
            dot.setAttribute("aria-current", "true");
          } else {
            dot.removeAttribute("aria-current");
          }
        });

        if (prev) {
          prev.disabled = index === 0;
        }

        if (next) {
          next.disabled = index === slides.length - 1;
        }
      }

      function scrollToSlide(index) {
        var slide = slides[Math.max(0, Math.min(index, slides.length - 1))];

        if (!slide) {
          return;
        }

        track.scrollTo({
          left: slide.offsetLeft - track.offsetLeft,
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      }

      function enableDragScroll() {
        if (!window.PointerEvent) {
          return;
        }

        var drag = {
          active: false,
          axis: "",
          moved: false,
          pointerId: null,
          startLeft: 0,
          startX: 0,
          startY: 0,
          suppressClick: false
        };

        function finishDrag(event) {
          if (!drag.active || event.pointerId !== drag.pointerId) {
            return;
          }

          drag.active = false;
          track.classList.remove("asx16-carousel__track--dragging");

          if (track.releasePointerCapture) {
            try {
              track.releasePointerCapture(event.pointerId);
            } catch (error) {
              // Pointer capture may already be released by the browser.
            }
          }

          if (drag.moved && drag.axis === "x") {
            drag.suppressClick = true;
            window.requestAnimationFrame(function () {
              scrollToSlide(getActiveIndex());
            });

            window.setTimeout(function () {
              drag.suppressClick = false;
            }, 120);
          }
        }

        track.addEventListener("pointerdown", function (event) {
          if (event.button !== 0 || event.target.closest("a, button, input, select, textarea")) {
            return;
          }

          drag.active = true;
          drag.axis = "";
          drag.moved = false;
          drag.pointerId = event.pointerId;
          drag.startLeft = track.scrollLeft;
          drag.startX = event.clientX;
          drag.startY = event.clientY;
          track.classList.add("asx16-carousel__track--dragging");

          if (track.setPointerCapture) {
            track.setPointerCapture(event.pointerId);
          }
        });

        track.addEventListener("pointermove", function (event) {
          if (!drag.active || event.pointerId !== drag.pointerId) {
            return;
          }

          var deltaX = event.clientX - drag.startX;
          var deltaY = event.clientY - drag.startY;
          var absX = Math.abs(deltaX);
          var absY = Math.abs(deltaY);

          if (!drag.axis && (absX > 6 || absY > 6)) {
            drag.axis = absX > absY ? "x" : "y";
          }

          if (drag.axis !== "x") {
            return;
          }

          event.preventDefault();
          drag.moved = absX > 4;
          track.scrollLeft = drag.startLeft - deltaX;
        });

        track.addEventListener("pointerup", finishDrag);
        track.addEventListener("pointercancel", finishDrag);
        track.addEventListener("lostpointercapture", function (event) {
          if (drag.active && event.pointerId === drag.pointerId) {
            finishDrag(event);
          }
        });

        track.addEventListener("click", function (event) {
          if (!drag.suppressClick) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
        }, true);

        track.addEventListener("dragstart", function (event) {
          event.preventDefault();
        });
      }

      if (prev) {
        prev.addEventListener("click", function () {
          scrollToSlide(getActiveIndex() - 1);
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          scrollToSlide(getActiveIndex() + 1);
        });
      }

      enableDragScroll();

      track.addEventListener("scroll", function () {
        window.requestAnimationFrame(function () {
          setActive(getActiveIndex());
        });
      }, { passive: true });

      track.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollToSlide(getActiveIndex() - 1);
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollToSlide(getActiveIndex() + 1);
        }
      });

      window.addEventListener("resize", function () {
        setActive(getActiveIndex());
      });

      setActive(0);
    });
  });
})();
