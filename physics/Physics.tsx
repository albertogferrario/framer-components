import React from "react"
import Matter from "matter-js"
import { addPropertyControls, ControlType } from "framer"

const DEFAULT_WALL_OPTS = {
    isStatic: true,
    friction: 2,
}

function makeWalls(containerBounding, engineOrWorld, wallOptions = {}) {
    const Bodies = Matter.Bodies
    const World = Matter.World

    // Accept both Engine and World
    const world = engineOrWorld?.world ?? engineOrWorld

    if (!world) {
        throw new Error(
            "makeWalls: expected a Matter.Engine or Matter.World as the second argument."
        )
    }

    const width = Number(containerBounding?.width ?? 0)
    const height = Number(containerBounding?.height ?? 0)

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {
        throw new Error(
            `makeWalls: invalid containerBounding dimensions (width: ${width}, height: ${height}).`
        )
    }

    const {
        top: addTop,
        right: addRight,
        bottom: addBottom,
        left: addLeft,
        wallOpts,
    } = wallOptions

    const opts = { ...DEFAULT_WALL_OPTS, ...(wallOpts || {}) }

    let top, right, bottom, left

    if (addBottom) {
        bottom = Bodies.rectangle(
            width / 2,
            height + 50,
            width + 100,
            100,
            opts
        )
        World.add(world, bottom)
    }

    if (addTop) {
        top = Bodies.rectangle(width / 2, -50, width + 100, 100, opts)
        World.add(world, top)
    }

    if (addRight) {
        right = Bodies.rectangle(width + 50, height / 2, 100, height, opts)
        World.add(world, right)
    }

    if (addLeft) {
        left = Bodies.rectangle(-50, height / 2, 100, height, opts)
        World.add(world, left)
    }

    return { top, right, bottom, left }
}

function makeBodies(container, world, elements, frictionOpts, densityOpts) {
    const conainerBounding = container.getBoundingClientRect()

    let stack = Matter.Composites.stack(
        0,
        0,
        elements.length,
        1,
        0,
        0,
        (xx, yy, i) => {
            const { x, y, width, height } = elements[i].getBoundingClientRect()

            var maxLeft = conainerBounding.width - width
            var maxTop = conainerBounding.height - height

            // Places the elements at random locations
            // Could be expanded to allow control of body placement from property controls
            var tLeft = Math.floor(Math.random() * maxLeft),
                tTop = Math.floor(Math.random() * maxTop)

            return Matter.Bodies.rectangle(tLeft, tTop, width, height, {
                isStatic: false,
                density: densityOpts.enable ? densityOpts.density : 0,
                friction: frictionOpts.friction,
                frictionAir: frictionOpts.frictionAir,
            })
        }
    )

    Matter.World.add(world, stack)
    return stack
}

/**
 * These annotations control how your component sizes
 * Learn more: https://www.framer.com/docs/guides/auto-sizing
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Physics(props) {
    let engine

    React.useEffect(() => {
        if (!engine) {
            engine = Matter.Engine.create({
                enableSleeping: props.sleeping,
                gravity: { y: props.gravY, x: props.gravX },
            })
            const containerBounding =
                containerRef.current.getBoundingClientRect()

            makeWalls(containerBounding, engine.world, props.wallOptions)

            if (props.debug) {
                var render = Matter.Render.create({
                    element: containerRef.current,
                    engine: engine,
                    options: {
                        height: containerBounding.height,
                        width: containerBounding.width,
                        showAngleIndicator: true,
                        showVelocity: true,
                    },
                })
                Matter.Render.run(render)
            }

            let mouseConstraint = null
            if (props.mouseOptions.enable) {
                let mouse = Matter.Mouse.create(containerRef.current)

                mouseConstraint = Matter.MouseConstraint.create(engine, {
                    mouse: mouse,
                    constraint: {
                        angularStiffness: props.mouseOptions.angularStiffness,
                        stiffness: props.mouseOptions.stiffness,
                    },
                })
                Matter.Composite.add(engine.world, mouseConstraint)
                // Remove the many event listeners preventing scroll/drag
                // mouseConstraint.mouse.element.removeEventListener(
                //     "mousewheel",
                //     mouseConstraint.mouse.mousewheel
                // )
                // mouseConstraint.mouse.element.removeEventListener(
                //     "DOMMouseScroll",
                //     mouseConstraint.mouse.mousewheel
                // )
                mouseConstraint.mouse.element.removeEventListener(
                    "touchstart",
                    mouseConstraint.mouse.mousedown
                )
                mouseConstraint.mouse.element.removeEventListener(
                    "touchmove",
                    mouseConstraint.mouse.mousemove
                )
                mouseConstraint.mouse.element.removeEventListener(
                    "touchend",
                    mouseConstraint.mouse.mouseup
                )

                mouseConstraint.mouse.element.addEventListener(
                    "touchstart",
                    mouseConstraint.mouse.mousedown,
                    { passive: true }
                )
                mouseConstraint.mouse.element.addEventListener(
                    "touchmove",
                    (e) => {
                        if (mouseConstraint.body) {
                            mouseConstraint.mouse.mousemove(e)
                        }
                    }
                )
                mouseConstraint.mouse.element.addEventListener(
                    "touchend",
                    (e) => {
                        if (mouseConstraint.body) {
                            mouseConstraint.mouse.mouseup(e)
                        }
                    }
                )

                containerRef.current.addEventListener("mouseleave", () => {
                    mouseConstraint.mouse.mouseup(event)
                })
            }

            let stack = makeBodies(
                containerRef.current,
                engine.world,
                containerRef.current.children,
                props.frictionOptions,
                props.densityOptions
            )

            // Update function :)
            ;(function update() {
                requestAnimationFrame(update)

                stack.bodies.forEach((block, i) => {
                    let el = containerRef.current.children[i]
                    let { x, y } = block.vertices[0]

                    el.style.visibility = "visible"

                    el.style.top = `${y}px`
                    el.style.left = `${x}px`
                    el.style.transform = `
                          translate(-50%, -50%)
                          rotate(${block.angle}rad) 
                          translate(50%, 50%)
                          `
                })
                //
                Matter.Engine.update(engine)
            })()
        }
    }, [])

    const containerRef = React.useRef(null)

    return (
        <div
            style={containerStyle}
            ref={containerRef}
            draggable="false"
            onDragStart={(e) => {
                e.preventDefault()
            }}
        >
            {props.children?.length > 0 ? (
                props.children.map((el, i) => {
                    return (
                        <div
                            style={bodyStyle}
                            id="physics-body"
                            draggable="false"
                        >
                            {el}
                        </div>
                    )
                })
            ) : (
                <div style={bodyStyle} id="physics-body" draggable="false">
                    {props.children}
                </div>
            )}
        </div>
    )
}

// Styles are written in object syntax
// Learn more: https://reactjs.org/docs/dom-elements.html#style
const containerStyle = {
    height: "100%",
    width: "100%",
    overflow: "hidden",
}
const bodyStyle = {
    position: "absolute",
    visibility: "hidden",
}

Physics.defaultProps = {
    gravX: 0,
    gravY: 1,
    children: {},
    wallOptions: { top: true, bottom: true, right: true, left: true },
    frictionOptions: { friction: 0.1, frictionAir: 0.01 },
    mouseOptions: {
        angularStiffnes: 0,
        stiffness: 0.2,
        enable: true,
    },
    densityOptions: { enable: true, density: 0.001 },
    sleeping: false,
}

addPropertyControls(Physics, {
    children: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
    },
    gravY: {
        type: ControlType.Number,
        defaultValue: 1,
        max: 5,
        min: -5,
        step: 0.25,
        title: "Gravity Y",
    },
    gravX: {
        type: ControlType.Number,
        defaultValue: 0,
        max: 5,
        min: -5,
        step: 0.25,
        title: "Gravity X",
    },
    wallOptions: {
        title: "Walls",
        type: ControlType.Object,
        controls: {
            top: { type: ControlType.Boolean, defaultValue: true },
            bottom: { type: ControlType.Boolean, defaultValue: true },

            right: { type: ControlType.Boolean, defaultValue: true },
            left: { type: ControlType.Boolean, defaultValue: true },
        },
    },

    mouseOptions: {
        title: "Mouse",
        type: ControlType.Object,
        controls: {
            enable: {
                title: "Enable",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            angularStiffness: {
                title: "Angular stiffness",
                description:
                    "A value of 0 allows objects to swing when held by the mouse",
                type: ControlType.Number,
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.01,
            },
            stiffness: {
                title: "Stiffness",
                description:
                    "Click + drag creates a moving constraint (spring) that follows the mouse. This describes the stiffness of that spring",
                type: ControlType.Number,
                defaultValue: 0.2,
                min: 0.001,
                max: 1,
                step: 0.01,
            },
        },
    },
    friction: {
        type: ControlType.Object,
        controls: {
            friction: {
                title: "Body friction",
                type: ControlType.Number,
                min: 0,
                max: 1,
                defaultValue: 0.1,
                step: 0.01,
            },
            frictionAir: {
                title: "Air friction",
                type: ControlType.Number,
                min: 0,
                max: 1,
                defaultValue: 0.01,
                step: 0.01,
            },
        },
    },
    densityOptions: {
        title: "Density",
        type: ControlType.Object,
        controls: {
            enable: {
                type: ControlType.Boolean,
                defaultValue: true,
                description:
                    "Enabling density will cause mass to be calculated based on width and height",
            },
            density: {
                type: ControlType.Number,
                defaultValue: 0.001,
                min: 0.001,
                max: 1,
                step: 0.01,
            },
        },
    },
    sleeping: {
        title: "Sleeping",
        description: "Improves performance at the cost of simulation accuracy",
        type: ControlType.Boolean,
        defaultValue: false,
    },
})

