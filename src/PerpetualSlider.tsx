import * as React from "react"
import { Frame, addPropertyControls, ControlType } from "framer"

/**
 * PerpetualSlider
 * - Renders a horizontal slider that loops infinitely.
 * - Each image is % based on maxVisibleItems and the container’s width.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export function PerpetualSlider(props) {
    const {
        items,
        padding,
        gap,
        borderRadius,
        maxVisibleItems,
        clipping,
        direction,
        ...rest
    } = props
    const containerRef = React.useRef(null)
    const [isReady, setIsReady] = React.useState(false)

    const images = items.map(({ image, _ }, index) => image)
    const urls = items.map(({ _, link }, index) => link)

    // We replicate the list of images 3 times to create
    // a center "main" chunk and two extra chunks (one on each side).
    const allImages = [...images, ...images, ...images, ...images, ...images]

    React.useEffect(() => {
        // Once the component mounts, scroll to the middle chunk
        if (containerRef.current) {
            // Wait for the layout to stabilize
            requestAnimationFrame(() => {
                // Scroll to the middle chunk
                if (direction === "h") {
                    const scrollWidth = containerRef.current.scrollWidth
                    const chunkWidth = scrollWidth / 5
                    containerRef.current.scrollLeft = chunkWidth
                } else {
                    const scrollWidth = containerRef.current.scrollTop
                    const chunkWidth = scrollWidth / 5
                    containerRef.current.scrolTop = chunkWidth
                }
                setIsReady(true)
            })
        }
    }, [images])

    // Handle scroll event to "jump" back or forward if the user
    // scrolls too far in either direction.
    const onScroll = React.useCallback(() => {
        if (!isReady || !containerRef.current) return

        let currentScroll = null
        let chunkWidth = null

        if (direction === "h") {
            const scrollWidth = containerRef.current.scrollWidth
            chunkWidth = scrollWidth / 5
            currentScroll = containerRef.current.scrollLeft
        } else {
            const scrollWidth = containerRef.current.scrollHeight
            chunkWidth = scrollWidth / 5
            currentScroll = containerRef.current.scrollTop
        }

        // If scroll is way to the left (before the middle chunk),
        // jump forward by one chunk:
        if (currentScroll < chunkWidth * 0.5) {
            if (direction === "h") {
                containerRef.current.scrollLeft += chunkWidth * 3
            } else {
                containerRef.current.scrollTop += chunkWidth * 3
            }
        }
        // If scroll is way to the right (past the middle chunk),
        // jump back by one chunk:
        else if (currentScroll > chunkWidth * 3.5) {
            if (direction === "h") {
                containerRef.current.scrollLeft -= chunkWidth * 3
            } else {
                containerRef.current.scrollTop -= chunkWidth * 3
            }
        }
    }, [isReady])

    const onWheel = React.useCallback((event) => {
        if (direction === "v") return

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
                    display: direction === "h" ? "block" : "flex",
                    flexDirection: "column",
                    height: "100%",
                    whiteSpace: "nowrap",
                    overflow: direction === "h" ? "hidden" : "scroll",
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE 10+
                    maskImage: `linear-gradient(${direction === "h" ? "to right" : "to bottom"}, transparent, black ${clipping / 2}%, black ${100 - clipping / 2}%, transparent)`,
                }}
            >
                {allImages.map((imgSrc, index) => (
                    <a
                        key={index}
                        href={urls[index % urls.length]}
                        style={{
                            display: "inline-block",
                            width:
                                direction === "h"
                                    ? `${(1 / maxVisibleItems) * 100}%`
                                    : "100%",
                            height:
                                direction === "h"
                                    ? "100%"
                                    : `${(1 / maxVisibleItems) * 100}%`,
                            padding:
                                direction === "h"
                                    ? `0 ${gap / 2}px`
                                    : `${gap / 2}px 0`,
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
    items: {
        title: "Collection",
        type: ControlType.Array,
        propertyControl: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [],
    },
    padding: {
        title: "Padding",
        type: ControlType.Padding,
        defaultValue: "0px",
    },
    borderRadius: {
        title: "Border Radius",
        type: ControlType.BorderRadius,
        defaultValue: "0px",
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
    direction: {
        title: "Direction",
        type: ControlType.Enum,
        options: ["h", "v"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "h",
    },
})

