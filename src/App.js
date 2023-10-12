import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import sheetData from "./sheetData";
import LuckyExcel from "luckyexcel";
import luckysheet from "luckysheet";
import { luckyToExcel } from "./services/luckyToExcel";
import { ProcessSoC } from "./services/processSoC";

export default function App() {
  const container = useRef();
  const [data, setData] = useState([sheetData]);

  useEffect(() => {
    if (container.current) {
      if (data instanceof File) {
        LuckyExcel.transformExcelToLucky(
          data,
          function (exportJson, luckysheetfile) {
            // After obtaining the converted table data, use luckysheet to initialize or update the existing luckysheet workbook
            // Note: Luckysheet needs to introduce a dependency package and initialize the table container before it can be used
            render(exportJson.sheets);
          },
          function (err) {
            console.error("Import failed. Is your fail a valid xlsx?");
          }
        );
      } else {
        render(data);
      }
    }
  }, [data]);

  const readFile = (e) => {
    let files = e.target.files;
    if (files) {
      setData(files[0]);
    }
  };

  const exportToExcel = () => {
    luckyToExcel(luckysheet, "excel-sheet");
  };

  const onUpdateCell = (r, c) => {
    luckysheet.setCellValue(r, c, "Hey!");
  };

  const getData = () => {
    let arr = luckysheet.getSheet();
    // let rows = arr.length;
    // let cols = arr[0].length;
    console.log(arr);
    const processSoC = new ProcessSoC();
    processSoC.processAllSoCs(arr);
    luckysheet.hideColumn(1, 3);
    // getContextualizedSoC(arr);
  };

  const onHighlight = () => {
    let curWs = luckysheet.getSheet();
    let allCells = curWs.celldata;
    luckysheet.setCellValue(
      2,
      2,
      "For details, please refer section Service Differentiation, QoS Enablement on page 36 in Nokia 7750 SR_Triple Play Service Delivery Architecture Guide.pdf"
    );
    luckysheet.setColumnWidth({ 2: 10 });
    console.log(curWs);
  };

  return (
    <div>
      <input type="file" name="upload" id="upload" onChange={readFile} />
      <button onClick={exportToExcel}>Export</button>
      <button onClick={() => onUpdateCell(2, 2)}>Update Current Cell</button>
      <button onClick={getData}>Get Data</button>
      <button onClick={onHighlight}>HighLight</button>
      <div className="App" id="container" ref={container}></div>
    </div>
  );
}
function render(data) {
  let options = {
    container: "container",
    showinfobar: false,
    showsheetbar: false,
    data,
    enableAddRow: false,
    showtoolbar: false,
    row: 26,
    gridKey: "xxxx",
    column: 26,
    allowUpdate: false,
    enableAddBackTop: false,
    //mx.session.sessionData.locale.code.split('_')[0]
    lang: "zh"
  };
  luckysheet.create(options);
}
