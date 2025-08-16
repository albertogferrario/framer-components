import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollSection(props) {
    const {
        sectionId,
        scrollOffset,
        enableSmoothScroll,
        children,
    } = props

    const sectionRef = useRef<HTMLDivElement>(null)
    const [isInView, setIsInView] = useState(false)

    useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        // Set ID for anchor targeting
        section.id = sectionId

        // Add data attribute for external targeting
        section.setAttribute("data-scroll-section", sectionId)

        // Handle navigation to this section
        const handleHashChange = () => {
            if (window.location.hash === `#${sectionId}`) {
                const yOffset = scrollOffset || 0
                const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset

                if (enableSmoothScroll) {
                    window.scrollTo({ top: y, behavior: "smooth" })
                } else {
                    window.scrollTo({ top: y, behavior: "auto" })
                }
            }
        }

        // Check if we should scroll on mount
        handleHashChange()

        // Listen for hash changes
        window.addEventListener("hashchange", handleHashChange)

        // Set up Intersection Observer for visibility detection
        const observerOptions = {
            root: null,
            rootMargin: `${-scrollOffset}px 0px 0px 0px`,
            threshold: 0.1,
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                setIsInView(entry.isIntersecting)
            })
        }, observerOptions)

        observer.observe(section)

        // Cleanup
        return () => {
            window.removeEventListener("hashchange", handleHashChange)
            observer.disconnect()
        }
    }, [sectionId, scrollOffset, enableSmoothScroll])

    // Handle programmatic scrolling
    useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        const scrollToSection = (e: CustomEvent) => {
            if (e.detail === sectionId) {
                const yOffset = scrollOffset || 0
                const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset

                if (enableSmoothScroll) {
                    window.scrollTo({ top: y, behavior: "smooth" })
                } else {
                    window.scrollTo({ top: y, behavior: "auto" })
                }
            }
        }

        window.addEventListener("scrollToSection" as any, scrollToSection)

        return () => {
            window.removeEventListener("scrollToSection" as any, scrollToSection)
        }
    }, [sectionId, scrollOffset, enableSmoothScroll])

    return (
        <div
            ref={sectionRef}
            data-is-in-view={isInView}
        >
            {children}
        </div>
    )
}

addPropertyControls(ScrollSection, {
    sectionId: {
        title: "Section ID",
        type: ControlType.String,
        defaultValue: "section-1",
        description: "Unique ID for anchor linking (e.g., #section-1)",
    },
    scrollOffset: {
        title: "Scroll Offset",
        type: ControlType.Number,
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 10,
        displayStepper: true,
        description: "Offset from top when scrolled to (useful for fixed headers)",
    },
    enableSmoothScroll: {
        title: "Smooth Scroll",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Enable smooth scrolling animation",
    },
})