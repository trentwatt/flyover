import { useState, useRef, useCallback, useMemo } from "react"
import { useCombobox } from "downshift"
import { useVirtual } from "react-virtual"

const ruby = "#900C3F"
const maroon = "#581845"
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
  const [inputValue, setInputValue] = useState("")
  const getItems = search =>
    allNodes.filter(n => n.toLowerCase().startsWith(search))
  const items = getItems(inputValue)
  const allNodesSet = useMemo(() => allNodes && new Set([...allNodes]), [
    allNodes,
  ])

  const listRef = useRef()
  const rowVirtualizer = useVirtual({
    size: items.length,
    parentRef: listRef,
    estimateSize: useCallback(() => 20, []),
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
    // defaultIsOpen: true,
    onInputValueChange: ({ inputValue: newValue }) => {
      setInputValue(newValue)
      if (allNodesSet.has(newValue)) {
        setHighlightNode(newValue)
        dispatch({ type: "START_NEW", payload: { nodeName: newValue } })
      }
    },
    // scrollIntoView: () => {},
    onHighlightedIndexChange: ({ highlightedIndex }) =>
      rowVirtualizer.scrollToIndex(highlightedIndex),
  })

  return (
    <div>
      <div>
        <label {...getLabelProps()}>Choose a Start Node:</label>
        <div {...getComboboxProps()}>
          <input
            {...getInputProps({
              onFocus: () => {
                if (!isOpen) {
                  openMenu()
                }
              },
              type: "text",
              position: "fixed",
              style: { zIndex: 100 },
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
                key={items[virtualRow.index]}
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
