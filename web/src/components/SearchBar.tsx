import { locationService } from "../services";
import { useAppSelector } from "../store";
import { memoSpecialTypes } from "../helpers/filter";
import "../less/search-bar.less";
import React, { useEffect, useState } from "react";
import Modal from "../components/common/Modal";
import { GoSearch } from "react-icons/go";

const SearchBar = () => {
  const memoType = useAppSelector((state) => state.location.query?.type);
  const [keyword, setKeyword] = useState("");
  const [showCmdK, setShowCmdK] = useState(false);
  const handleMemoTypeItemClick = (type: MemoSpecType | undefined) => {
    // setShowCmdK(false);
    const { type: prevType } = locationService.getState().query ?? {};
    if (type === prevType) {
      type = undefined;
    }
    locationService.setMemoTypeQuery(type);
  };

  const handleTextQueryInput = (event: React.FormEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;

    setKeyword(text);
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((navigator?.platform?.toLowerCase().includes("mac") ? e.metaKey : e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        setShowCmdK(!showCmdK);
      }
      console.log(e.key);
      if (e.key === "Enter") {
        locationService.setTextQuery(keyword);
        setShowCmdK(false);
      }
      if (e.key === "Escape") {
        setShowCmdK(false);
      }
    }

    if (!showCmdK) setKeyword("");

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCmdK, keyword]);

  return (
    <div className="search-bar-container">
      <div className="search-wrapper">
        <GoSearch />
        <span>搜索</span>
        <span>⌘K</span>
      </div>
      <Modal visible={showCmdK}>
        <div className="command-k">
          <input autoFocus value={keyword} onChange={handleTextQueryInput} />
          <div className="title">快速检索</div>
          <div>
            {memoSpecialTypes.map((t, idx) => (
              <span
                key={idx}
                className={`${memoType === t.value ? "active" : ""}`}
                onClick={() => handleMemoTypeItemClick(t.value as MemoSpecType)}
              >
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SearchBar;
