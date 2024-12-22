import React from 'react'
import { Input } from '../ui/input'

function Search() {
  return (
    <div>
      <Input
        id="search"
        placeholder="Search"
        type="text"
        autoComplete='off'
        autoCapitalize="none"
      />
    </div>
  )
}

export default Search
