import * as React from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

/**
 * InfiniteHorizontalSlider
 * - Renders a horizontal slider that loops infinitely.
 * - Each image is 20% of the container’s width.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export function PerpetualSlider(props) {
    const {
        images,
        links,
        padding,
        gap,
        borderRadius,
        maxVisibleItems,
        clipping,
        ...rest
    } = props
    const containerRef = React.useRef(null)
    const [isReady, setIsReady] = React.useState(false)

    // We replicate the list of images 3 times to create
    // a center "main" chunk and two extra chunks (one on each side).
    const allImages = [...images, ...images, ...images]

    React.useEffect(() => {
        // Once the component mounts, scroll to the middle chunk
        if (containerRef.current) {
            // Wait for the layout to stabilize
            requestAnimationFrame(() => {
                // Scroll to the middle chunk
                const scrollWidth = containerRef.current.scrollWidth
                const chunkWidth = scrollWidth / 3
                containerRef.current.scrollLeft = chunkWidth
                setIsReady(true)
            })
        }
    }, [images])

    // Handle scroll event to "jump" back or forward if the user
    // scrolls too far in either direction.
    const onScroll = React.useCallback(() => {
        if (!isReady || !containerRef.current) return
        const scrollWidth = containerRef.current.scrollWidth
        const chunkWidth = scrollWidth / 3
        const currentScroll = containerRef.current.scrollLeft

        // If scroll is way to the left (before the middle chunk),
        // jump forward by one chunk:
        if (currentScroll < chunkWidth * 0.5) {
            containerRef.current.scrollLeft += chunkWidth
        }
        // If scroll is way to the right (past the middle chunk),
        // jump back by one chunk:
        else if (currentScroll > chunkWidth * 1.5) {
            containerRef.current.scrollLeft -= chunkWidth
        }
    }, [isReady])

    const onWheel = React.useCallback((event) => {
        event.preventDefault()
        if (containerRef.current) {
            containerRef.current.scrollLeft += event.deltaY
        }
    }, [])

    return (
        <Frame background={"transparent"} {...rest}>
            <div
                ref={containerRef}
                onScroll={onScroll}
                onWheel={onWheel}
                style={{
                    height: "100%",
                    whiteSpace: "nowrap",
                    overflowX: "hidden",
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE 10+
                    maskImage: `linear-gradient(to right, transparent, black ${clipping / 2}%, black ${100 - clipping / 2}%, transparent)`,
                }}
            >
                {allImages.map((imgSrc, index) => (
                    <a
                        key={index}
                        href={links[index % links.length]}
                        style={{
                            display: "inline-block",
                            width: `${(1 / maxVisibleItems) * 100}%`,
                            height: "100%",
                            padding: `0 ${gap / 2}px`,
                        }}
                    >
                        <img
                            src={imgSrc}
                            style={{
                                padding: padding,
                                borderRadius: borderRadius,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                            draggable={false}
                        />
                    </a>
                ))}
            </div>
        </Frame>
    )
}

// Property controls for the component
addPropertyControls(PerpetualSlider, {
    images: {
        title: "Images",
        type: ControlType.Array,
        propertyControl: {
            type: ControlType.Image,
        },
    },
    links: {
        title: "Links",
        type: ControlType.Array,
        propertyControl: {
            type: ControlType.String,
        },
    },
    padding: {
        title: "Padding",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        title: "Border Radius",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        step: 1,
        unit: "px",
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        step: 1,
        unit: "px",
    },
    maxVisibleItems: {
        title: "Max Visible Items",
        type: ControlType.Number,
        defaultValue: 5,
        min: 0,
        step: 1,
    },
    clipping: {
        type: ControlType.Number,
        title: "Clipping",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
})

