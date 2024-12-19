import React from "react";
import { Input } from "../ui/input";

function Search() {
  return (
    <div>
      <Input
        id="search"
        placeholder="Search"
        type="text"
        autoCapitalize="none"
      />
    </div>
  );
}

export default Search;