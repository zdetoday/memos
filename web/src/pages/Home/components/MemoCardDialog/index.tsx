import { useState, useEffect, useCallback } from "react";
import { editorStateService, memoService, userService } from "../../../../services";
import { IMAGE_URL_REG, MEMO_LINK_REG, UNKNOWN_ID } from "../../../../helpers/consts";
import * as utils from "../../../../helpers/utils";
import { formatMemoContent, parseHtmlToRawText } from "../../../../helpers/marked";
import Only from "../../../../components/OnlyWhen";
import { Toast } from "@/components";
import { generateDialog } from "../../../../components/Dialog";
// import Image from "../../../../components/Image";
import Selector from "../../../../components/Selector";
import "./index.less";

interface LinkedMemo extends Memo {
  createdAtStr: string;
  dateStr: string;
}

interface Props extends DialogProps {
  memo: Memo;
}

const Index: React.FC<Props> = (props: Props) => {
  const [memo, setMemo] = useState<Memo>({
    ...props.memo,
  });
  const [linkMemos, setLinkMemos] = useState<LinkedMemo[]>([]);
  const [linkedMemos, setLinkedMemos] = useState<LinkedMemo[]>([]);
  const imageUrls = Array.from(memo.content.match(IMAGE_URL_REG) ?? []).map((s) => s.replace(IMAGE_URL_REG, "$1"));
  const visibilityList = [
    { text: "PUBLIC", value: "PUBLIC" },
    { text: "PROTECTED", value: "PROTECTED" },
    { text: "PRIVATE", value: "PRIVATE" },
  ];

  useEffect(() => {
    const fetchLinkedMemos = async () => {
      try {
        const linkMemos: LinkedMemo[] = [];
        const matchedArr = [...memo.content.matchAll(MEMO_LINK_REG)];
        for (const matchRes of matchedArr) {
          if (matchRes && matchRes.length === 3) {
            const id = Number(matchRes[2]);
            if (id === memo.id) {
              continue;
            }

            const memoTemp = memoService.getMemoById(id);
            if (memoTemp) {
              linkMemos.push({
                ...memoTemp,
                createdAtStr: utils.getDateTimeString(memoTemp.createdTs),
                dateStr: utils.getDateString(memoTemp.createdTs),
              });
            }
          }
        }
        setLinkMemos([...linkMemos]);

        const linkedMemos = await memoService.getLinkedMemos(memo.id);
        setLinkedMemos(
          linkedMemos
            .filter((m) => m.rowStatus === "NORMAL" && m.id !== memo.id)
            .sort((a, b) => utils.getTimeStampByDate(b.createdTs) - utils.getTimeStampByDate(a.createdTs))
            .map((m) => ({
              ...m,
              createdAtStr: utils.getDateTimeString(m.createdTs),
              dateStr: utils.getDateString(m.createdTs),
            }))
        );
      } catch (error) {
        // do nth
      }
    };

    fetchLinkedMemos();
  }, [memo.id]);

  const handleMemoContentClick = useCallback(async (e: React.MouseEvent) => {
    const targetEl = e.target as HTMLElement;

    if (targetEl.className === "memo-link-text") {
      const nextMemoId = targetEl.dataset?.value;
      const memoTemp = memoService.getMemoById(Number(nextMemoId) ?? UNKNOWN_ID);

      if (memoTemp) {
        const nextMemo = {
          ...memoTemp,
          createdAtStr: utils.getDateTimeString(memoTemp.createdTs),
        };
        setLinkMemos([]);
        setLinkedMemos([]);
        setMemo(nextMemo);
      } else {
        Toast.info("MEMO Not Found");
        targetEl.classList.remove("memo-link-text");
      }
    }
  }, []);

  const handleLinkedMemoClick = useCallback((memo: Memo) => {
    setLinkMemos([]);
    setLinkedMemos([]);
    setMemo(memo);
  }, []);

  const handleEditMemoBtnClick = () => {
    props.destroy();
    editorStateService.setEditMemoWithId(memo.id);
  };

  const handleVisibilitySelectorChange = async (visibility: Visibility) => {
    if (memo.visibility === visibility) {
      return;
    }

    await memoService.patchMemo({
      id: memo.id,
      visibility: visibility,
    });
    setMemo({
      ...memo,
      visibility: visibility,
    });
  };

  return (
    <>
      <div className="memo-card-container">
        <div className="memo-container">
          <div className="card-cover" />
          <div className="header-container">
            <p className="time-text">{utils.getDateTimeString(memo.createdTs)}</p>
          </div>
          <div
            className="memo-content-text"
            onClick={handleMemoContentClick}
            dangerouslySetInnerHTML={{ __html: formatMemoContent(memo.content) }}
          />
        </div>
        {/*<div className="layer-container"></div>*/}
        {linkMemos.map((_, idx) => {
          if (idx < 4) {
            return (
              <div
                className="background-layer-container"
                key={idx}
                style={{
                  bottom: (idx + 1) * -3 + "px",
                  left: (idx + 1) * 5 + "px",
                  width: `calc(100% - ${(idx + 1) * 10}px)`,
                  zIndex: -idx - 1,
                }}
              />
            );
          } else {
            return null;
          }
        })}
        {linkMemos.length > 0 ? (
          <div className="linked-memos-wrapper">
            <p className="normal-text">{linkMemos.length} related MEMO</p>
            {linkMemos.map((memo, index) => {
              const rawtext = parseHtmlToRawText(formatMemoContent(memo.content)).replaceAll("\n", " ");
              return (
                <div className="linked-memo-container" key={`${index}-${memo.id}`} onClick={() => handleLinkedMemoClick(memo)}>
                  <span className="time-text">{memo.dateStr} </span>
                  {rawtext}
                </div>
              );
            })}
          </div>
        ) : null}
        {linkedMemos.length > 0 ? (
          <div className="linked-memos-wrapper">
            <p className="normal-text">{linkedMemos.length} linked MEMO</p>
            {linkedMemos.map((memo, index) => {
              const rawtext = parseHtmlToRawText(formatMemoContent(memo.content)).replaceAll("\n", " ");
              return (
                <div className="linked-memo-container" key={`${index}-${memo.id}`} onClick={() => handleLinkedMemoClick(memo)}>
                  <span className="time-text">{memo.dateStr} </span>
                  {rawtext}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <Only when={!userService.isVisitorMode()}>
        <button className="btn edit-btn" onClick={handleEditMemoBtnClick}>
          {/*<Icon.Edit3 className="icon-img" />*/}
        </button>
      </Only>
      <Only when={!userService.isVisitorMode()}>
        <div className="card-header-container">
          <div className="visibility-selector-container">
            {/*<Icon.Eye className="icon-img" />*/}
            <Selector
              className="visibility-selector"
              dataSource={visibilityList}
              value={memo.visibility}
              handleValueChanged={(value) => handleVisibilitySelectorChange(value as Visibility)}
            />
          </div>
        </div>
      </Only>
    </>
  );
};

export default function showMemoCardDialog(memo: Memo): void {
  generateDialog(
    {
      className: "memo-card-dialog",
    },
    Index,
    { memo }
  );
}
