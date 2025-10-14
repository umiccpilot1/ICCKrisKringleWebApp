import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver({ threshold = 0.1, root = null, rootMargin = '0px', once = true } = {}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) {
          observer.unobserve(entry.target);
        }
      } else if (!once) {
        setIsVisible(false);
      }
    }, { threshold, root, rootMargin });

    const current = elementRef.current;

    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [threshold, root, rootMargin, once]);

  return [elementRef, isVisible];
}
