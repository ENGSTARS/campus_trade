import { useMemo } from 'react'

export function usePagination(items = [], currentPage = 1, perPage = 8) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(Math.max(currentPage, 1), totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * perPage
    return items.slice(start, start + perPage)
  }, [items, perPage, safePage])

  return { totalPages, safePage, paginatedItems }
}
