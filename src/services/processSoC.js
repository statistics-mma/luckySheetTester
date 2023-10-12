export class ProcessSoC {
  contextualisation = {};
  queryList = [];
  outputCol = "D";
  clauseCol = ["B"];
  serialCol = ["A"];
  rowStart = 2;

  getContextualizedSoC = (curWS, process) => {
    // Add conditions for row and col inputs must be filed.
    // Need to ask why +1
    let rowEnd = curWS.data.length - 1;
    // Provide col-start from clauseCol
    let clauseColSorted = this.clauseCol.sort();
    let headerColSorted = this.serialCol.sort();
    let sCol = clauseColSorted[0];

    let levelStr = [];
    let colNames = [];
    let hColNames = [];
    let answerColInBetweenCols = false;

    // Add field conditions

    if (clauseColSorted.length == 1) {
      clauseColSorted.push(clauseColSorted[0]);
    }
    if (headerColSorted.length == 1) {
      headerColSorted.push(headerColSorted[0]);
    }

    do {
      if (sCol === this.outputCol) {
        answerColInBetweenCols = true;
      }
      levelStr.push("");
      colNames.push(sCol);

      sCol = String.fromCharCode(sCol.charCodeAt(0) + 1);
    } while (sCol.charCodeAt(0) <= clauseColSorted[1].charCodeAt(0));

    if (headerColSorted.length > 0) {
      sCol = headerColSorted[0];
      do {
        hColNames.push(sCol);
        sCol = String.fromCharCode(sCol.charCodeAt(0) + 1);
      } while (sCol.charCodeAt(0) <= headerColSorted[1].charCodeAt(0));
    }

    // Add conditions for SoC Answer Col

    // Format cell content
    // Ask why row 1
    for (let row = 0; row <= rowEnd; row++) {
      for (let col = 0; col < colNames.length; col++) {
        let cellVal =
          curWS.data[row][colNames[col].charCodeAt(0) - 65]?.v || "";
        levelStr[col] = cellVal || "";
      }
      this.contextualisation[`IT${row}`] = (levelStr.join(" | ") || "").trim();

      let strHeading = "";
      for (let col = 0; col < hColNames.length; col++) {
        let cellVal =
          curWS.data[row][hColNames[col].charCodeAt(0) - 65]?.v || "";
        strHeading += (strHeading != "" ? ". " : "") + (cellVal || "");
      }
      this.contextualisation[`IS${row}`] = strHeading.trim();
    }

    let lastItemIndex = 0;
    let lastItemHead = "";
    let lastPIndex = -1;
    let patternMismatch = false;

    for (let row = 0; row <= rowEnd; row++) {
      let hidden = false;
      // Ask whether it is row or col
      let hiddenRows = curWS.config.rowhidden;
      for (let hiddenRow in hiddenRows) {
        if (hiddenRow == row) {
          hidden = true;
          break;
        }
      }

      let _query = this.contextualisation[`IT${row}`];
      let _head = this.contextualisation[`IS${row}`];

      let headingNo = this.getHeadingNumber(_head);
      this.contextualisation[`IS${row}`] = headingNo;

      if (_query.startsWith(headingNo)) {
        _query = _query.slice(headingNo.length - 1).trim();
      }

      let queryObj = {
        id: this.queryList?.length,
        query: _query,
        headingNo: headingNo,
        level: 0,
        pIndex: -1,
        cellRef: `IT${row}`,
        hidden: hidden
      };
      if (process == "upload") {
        // Upload SoC goes here!
      }
      if (headingNo.startsWith(lastItemHead + ".")) {
        if (lastPIndex != -1) {
          this.queryList[lastPIndex].level++;
        }
        lastPIndex = lastItemIndex;
        queryObj.pIndex = lastItemIndex;
        this.queryList[lastPIndex].level++;
        patternMismatch = false;
      } else if (
        lastPIndex >= 0 &&
        headingNo.startsWith(this.queryList[lastPIndex].headingNo + ".")
      ) {
        queryObj.pIndex = lastPIndex;
        this.queryList[lastPIndex].level++;
        patternMismatch = false;
      } else if (lastPIndex >= 0) {
        let parentOfParent = this.queryList[lastPIndex].pIndex;
        if (headingNo.startsWith(this.queryList[lastPIndex].headingNo + ".")) {
          lastPIndex = this.queryList[lastPIndex].pIndex;
          queryObj.pIndex = lastPIndex;
          this.queryList[lastPIndex].level++;
          patternMismatch = false;
        } else if (
          lastPIndex > 0 &&
          parentOfParent >= 0 &&
          headingNo.startsWith(this.queryList[parentOfParent].headingNo + ".")
        ) {
          lastPIndex = this.queryList[lastPIndex].pIndex;
          queryObj.pIndex = lastPIndex;
          patternMismatch = false;
        } else {
          {
            let lastItemPattern =
              lastItemHead.length < 1 ? false : !isNaN(lastItemHead[0]);
            let currentItemPattern =
              headingNo.length < 1 ? false : !isNaN(headingNo[0]);
            if (
              lastItemPattern != currentItemPattern &&
              patternMismatch == false
            ) {
              queryObj.pIndex = lastItemIndex;
              this.queryList[lastItemIndex].Level++; //1
              this.queryList[lastPIndex].Level++; //2
              lastPIndex = lastItemIndex;
              patternMismatch = true;
            } else if (patternMismatch == true && currentItemPattern == false) {
              lastPIndex = this.queryList[lastItemIndex].pIndex;
              queryObj.pIndex = lastPIndex;
            } else if (currentItemPattern == true) {
              patternMismatch = false;
            }
          }
        }
      }
      this.queryList.push(queryObj);
      lastItemIndex = this.queryList.length - 1;
      if (headingNo != "") {
        lastItemHead = headingNo;
      }
    }

    let skipCount = this.rowStart - 1;
    if (skipCount < 0) {
      skipCount = 0;
    }

    return this.queryList
      .slice(skipCount)
      .filter((query) => query.level == 0 && query.hidden == false).length;
  };

  getHeadingNumber = (qHead) => {
    let headingNo = "";
    let head = qHead.trim();
    if (head.length > 10) {
      head = head.slice(0, 10);
    }
    let headArr = head.split(" ");

    let formats = [
      /^-?\d+$/,
      /\d+(\.\d+)$/,
      /\d+\.$/,
      /^[A-Za-z][\.\-\)]$/,
      /^\([A-Za-z]\)$/
    ];

    for (let format of formats) {
      if (headArr[0].match(format)) {
        headingNo = headArr[0];
      }
    }

    if (headingNo.endsWith(".") && headingNo.length > 1) {
      headingNo = headingNo.slice(0, headingNo.length - 1);
    }
    return headingNo;
  };

  processAllSoCs = (ws, process) => {
    let totalSoCs = this.getContextualizedSoC(ws, process);
    if (totalSoCs == -1) {
      return;
    }

    let skipCount = this.rowStart - 1;
    if (skipCount < 0) skipCount = 0;
    let socList = this.queryList
      .slice(skipCount)
      .filter((query) => query.level == 0 && query.hidden == false);

    // console.log(socList, "Final List");
    console.log(this.queryList, socList);
    for (let qSoC of socList) {
      if (qSoC.query.trim() == "") {
        continue;
      }
      // qSoC.
      console.log(this.prepareConstructedSoC(qSoC, this.queryList));
    }
  };

  prepareConstructedSoC = (socQuery, socList) => {
    let actualSoCString = socList[socQuery.id].query || "";
    let soc = "";
    let pi = socList[socQuery.id].pIndex;

    while (pi >= 0) {
      if (soc != "") {
        soc = " || " + soc;
      }
      soc = socList[pi].query + soc;
      pi = socList[pi].pIndex;
    }
    let sFullQuery = (soc == ""
      ? actualSoCString
      : soc + " ||| " + actualSoCString
    ).trim();
    if (sFullQuery.length > 2 && sFullQuery.startsWith("||")) {
      sFullQuery = sFullQuery.slice(2);
    }
    return sFullQuery;
  };
}
