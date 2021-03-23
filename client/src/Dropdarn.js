import React, { useState, useCallback, useRef, useMemo } from "react"
import { useCombobox } from "downshift"
import { useVirtual } from "react-virtual"

const ruby = "#900C3F"
const maroon = "#581845"
const comboboxStyles = {}
const menuStyles = {
  maxHeight: 120,
  maxWidth: 300,
  overflowY: "scroll",
  backgroundColor: ruby,
  padding: 0,
  listStyle: "none",
  position: "relative",
  zIndex: 1,
}

export default function Dropdown({ allNodes, dispatch, setHighlightNode }) {
  const getItems = useCallback(
    search => allNodes.filter(n => n.toLowerCase().includes(search)),
    [allNodes]
  )
  const allNodesSet = useMemo(() => allNodes && new Set([...allNodes]), [
    allNodes,
  ])
  const [inputValue, setInputValue] = useState("")
  const items = getItems(inputValue)
  const listRef = useRef()
  const rowVirtualizer = useVirtual({
    size: items.length,
    parentRef: listRef,
    estimateSize: useCallback(() => 30, []),
    overscan: 2,
  })
  const {
    getInputProps,
    getItemProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    // selectedItem,
    getComboboxProps,
    isOpen,
    openMenu,
  } = useCombobox({
    items,
    inputValue,
    onInputValueChange: ({ inputValue: newValue }) => {
      setInputValue(newValue)
      if (allNodesSet.has(newValue)) {
        setHighlightNode(newValue)
        dispatch({ type: "START_NEW", payload: { nodeName: newValue } })
      }
    },
    scrollIntoView: () => {},
    onHighlightedIndexChange: ({ highlightedIndex }) =>
      rowVirtualizer.scrollToIndex(highlightedIndex),
  })

  return (
    <div>
      <div>
        <label {...getLabelProps()}>Choose a Start Node:</label>
        <div {...getComboboxProps()} style={comboboxStyles}>
          <input
            {...getInputProps({
              onFocus: () => {
                if (!isOpen) {
                  openMenu()
                }
              },
              type: "text",
            })}
          />
        </div>
      </div>
      <ul
        {...getMenuProps({
          ref: listRef,
          style: menuStyles,
        })}
      >
        {isOpen && (
          <>
            <li key="total-size" style={{ height: rowVirtualizer.totalSize }} />
            {rowVirtualizer.virtualItems.map(virtualRow => (
              <li
                key={items[virtualRow.index].id}
                {...getItemProps({
                  index: virtualRow.index,
                  item: items[virtualRow.index],
                  style: {
                    backgroundColor:
                      highlightedIndex === virtualRow.index
                        ? maroon
                        : "inherit",
                    // fontWeight:
                    //   selectedItem &&
                    //   selectedItem.id === items[virtualRow.index].id
                    //     ? "bold"
                    //     : "normal",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  },
                })}
              >
                {items[virtualRow.index]}
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  )
}
