class Calculator {
  constructor() {
    this.previousOperand = "";
    this.currentOperand = "0";
    this.operation = undefined;
    this.justEvaluated = false;
    this.history = [];
    this.lastOperand = null;
    this.lastOperation = null;
    this.previousValue = null; // Lưu giá trị số của previousOperand khi là biểu thức
    this.init();
  }

  // Làm tròn số để tránh lỗi floating-point
  roundResult(num) {
    // Làm tròn đến 10 chữ số thập phân
    return Math.round(num * 10000000000) / 10000000000;
  }

  init() {
    this.displayElement = document.querySelector(".current-operand");
    this.previousOperandElement = document.querySelector(".previous-operand");
    this.historyPanel = document.querySelector(".history-panel");
    this.historyList = document.querySelector(".history-list");
    this.historyBtn = document.querySelector(".history-btn");
    this.setupEventListeners();
    this.setupHistoryToggle();
    this.setupKeyboardSupport();
  }

  setupHistoryToggle() {
    if (this.historyBtn && this.historyPanel) {
      this.historyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isVisible = this.historyPanel.style.display === "block";
        this.historyPanel.style.display = isVisible ? "none" : "block";
        if (!isVisible) {
          this.updateHistoryDisplay();
        }
      });

      // Click outside to close
      document.addEventListener("click", (e) => {
        if (
          !this.historyPanel.contains(e.target) &&
          !this.historyBtn.contains(e.target) &&
          this.historyPanel.style.display === "block"
        ) {
          this.historyPanel.style.display = "none";
        }
      });

      // Clear history button
      const clearBtn = this.historyPanel.querySelector(".clear-history-btn");
      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.history = [];
          this.updateHistoryDisplay();
        });
      }
    }
  }

  setupEventListeners() {
    document.querySelectorAll(".number").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.action === "negate") {
          this.negate();
        } else {
          if (this.justEvaluated) {
            this.currentOperand =
              button.innerText === "." ? "0." : button.innerText;
            this.justEvaluated = false;
          } else {
            this.appendNumber(button.innerText);
          }
        }
        this.updateDisplay();
      });
    });

    document.querySelectorAll(".operation").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        switch (action) {
          case "clear":
            this.clear();
            break;
          case "clear-all":
            this.clearAll();
            break;
          case "backspace":
            this.delete();
            break;
          case "percent":
            this.percent();
            break;
          case "reciprocal":
            this.reciprocal();
            break;
          case "square":
            this.square();
            break;
          case "sqrt":
            this.sqrt();
            break;
          default:
            this.chooseOperation(button.innerText);
        }
        this.updateDisplay();
      });
    });

    document.querySelector(".equals").addEventListener("click", () => {
      this.compute();
      this.updateDisplay();
    });
  }

  updateHistoryDisplay() {
    if (!this.historyList) return;
    if (this.history.length === 0) {
      this.historyList.innerHTML =
        '<div style="color: #666; text-align: center; padding: 10px;">No history yet</div>';
      return;
    }
    this.historyList.innerHTML = this.history
      .map(
        (item) =>
          `<div style="text-align: right; padding: 4px 0;">${item}</div>`
      )
      .join("");
  }

  clear() {
    this.currentOperand = "0";
    this.justEvaluated = false;
  }

  clearAll() {
    this.currentOperand = "0";
    this.previousOperand = "";
    this.operation = undefined;
    this.lastOperand = null;
    this.lastOperation = null;
    this.justEvaluated = false;
  }

  delete() {
    // Reset về "0" nếu là thông báo lỗi
    if (
      this.currentOperand.includes("Cannot") ||
      this.currentOperand.includes("Invalid") ||
      this.currentOperand.includes("Infinity")
    ) {
      this.currentOperand = "0";
      return;
    }

    if (this.currentOperand === "0") return;
    if (this.currentOperand.length === 1) {
      this.currentOperand = "0";
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
  }

  appendNumber(number) {
    // Reset if currentOperand is an error message
    if (
      this.currentOperand.includes("Cannot") ||
      this.currentOperand.includes("Invalid")
    ) {
      this.currentOperand = "0";
      this.previousOperand = "";
    }

    if (number === "." && this.currentOperand.includes(".")) return;
    if (this.currentOperand === "0" && number !== ".") {
      this.currentOperand = number;
    } else {
      this.currentOperand += number;
    }
  }

  chooseOperation(operation) {
    if (this.currentOperand === "") return;

    // Nếu đã có toán tử và currentOperand vẫn là "0" (chưa nhập số mới),
    // chỉ cần thay đổi toán tử, không tính toán
    if (this.operation != null && this.currentOperand === "0") {
      this.operation = operation;
      return;
    }

    // Nếu đã có operation và đã nhập số mới (currentOperand khác "0"), tính toán trước
    if (this.operation != null && this.currentOperand !== "0") {
      this.compute();
    }

    this.operation = operation;

    // Nếu previousOperand kết thúc bằng "=" (từ phép đặc biệt), giữ nguyên biểu thức
    if (this.previousOperand && this.previousOperand.endsWith("=")) {
      this.previousOperand = this.previousOperand.slice(0, -1).trim();
      this.previousValue = parseFloat(this.currentOperand); // Lưu giá trị số
    } else {
      this.previousOperand = this.currentOperand;
      this.previousValue = parseFloat(this.currentOperand);
    }

    this.currentOperand = "0";
    this.lastOperand = null;
    this.lastOperation = null;
  }

  compute() {
    // If user presses = again after a calculation, repeat the last operation
    if (this.justEvaluated && this.lastOperation && this.lastOperand !== null) {
      const prev = parseFloat(this.currentOperand);
      let computation;
      let historyStr = "";

      switch (this.lastOperation) {
        case "+":
          computation = this.roundResult(prev + this.lastOperand);
          historyStr = `${prev} + ${this.lastOperand} = ${computation}`;
          this.previousOperand = `${prev} + ${this.lastOperand} =`;
          break;
        case "-":
          computation = this.roundResult(prev - this.lastOperand);
          historyStr = `${prev} - ${this.lastOperand} = ${computation}`;
          this.previousOperand = `${prev} - ${this.lastOperand} =`;
          break;
        case "×":
          computation = this.roundResult(prev * this.lastOperand);
          historyStr = `${prev} × ${this.lastOperand} = ${computation}`;
          this.previousOperand = `${prev} × ${this.lastOperand} =`;
          break;
        case "÷":
          if (this.lastOperand === 0) {
            historyStr = `${prev} ÷ ${this.lastOperand} = Cannot divide by zero`;
            this.currentOperand = "Cannot divide by zero";
            this.previousOperand = "";
            this.history.unshift(historyStr);
            if (this.history.length > 10) this.history.pop();
            if (
              this.historyPanel &&
              this.historyPanel.style.display === "block"
            ) {
              this.updateHistoryDisplay();
            }
            return;
          }
          computation = this.roundResult(prev / this.lastOperand);
          historyStr = `${prev} ÷ ${this.lastOperand} = ${computation}`;
          this.previousOperand = `${prev} ÷ ${this.lastOperand} =`;
          break;
        default:
          return;
      }

      this.currentOperand = computation.toString();
      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
      if (this.historyPanel && this.historyPanel.style.display === "block") {
        this.updateHistoryDisplay();
      }
      return;
    }

    let computation;
    const prev =
      this.previousValue !== null
        ? this.previousValue
        : parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);
    if (isNaN(prev) || isNaN(current)) return;

    let historyStr = "";
    switch (this.operation) {
      case "+":
        computation = this.roundResult(prev + current);
        historyStr = `${this.previousOperand} + ${current} = ${computation}`;
        this.previousOperand = `${this.previousOperand} + ${current} =`;
        break;
      case "-":
        computation = this.roundResult(prev - current);
        historyStr = `${this.previousOperand} - ${current} = ${computation}`;
        this.previousOperand = `${this.previousOperand} - ${current} =`;
        break;
      case "×":
        computation = this.roundResult(prev * current);
        historyStr = `${this.previousOperand} × ${current} = ${computation}`;
        this.previousOperand = `${this.previousOperand} × ${current} =`;
        break;
      case "÷":
        if (current === 0) {
          historyStr = `${this.previousOperand} ÷ ${current} = Cannot divide by zero`;
          this.currentOperand = "Cannot divide by zero";
          this.previousOperand = "";
          this.operation = undefined;
          this.justEvaluated = true;
          this.previousValue = null;
          this.history.unshift(historyStr);
          if (this.history.length > 10) this.history.pop();
          if (
            this.historyPanel &&
            this.historyPanel.style.display === "block"
          ) {
            this.updateHistoryDisplay();
          }
          return;
        }
        computation = this.roundResult(prev / current);
        historyStr = `${this.previousOperand} ÷ ${current} = ${computation}`;
        this.previousOperand = `${this.previousOperand} ÷ ${current} =`;
        break;
      default:
        return;
    }

    this.currentOperand = computation.toString();
    // Save last operation and operand for repeated = presses
    this.lastOperand = current;
    this.lastOperation = this.operation;
    // Add to history
    this.history.unshift(historyStr);
    if (this.history.length > 10) this.history.pop();
    if (this.historyPanel && this.historyPanel.style.display === "block") {
      this.updateHistoryDisplay();
    }
    this.operation = undefined;
    this.previousValue = null; // Reset previousValue sau khi tính toán
    this.justEvaluated = true;
  }

  percent() {
    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    let result;
    let historyStr;

    // Nếu đang ở giữa phép tính (có operation và previousOperand)
    if (
      this.operation &&
      this.previousOperand &&
      !this.previousOperand.endsWith("=")
    ) {
      const prev = parseFloat(this.previousOperand);
      // Tính phần trăm của số trước đó
      const percentValue = this.roundResult((prev * current) / 100);
      result = percentValue;

      // Hiển thị theo kiểu Windows: "10% of 50"
      this.currentOperand = result.toString();
      historyStr = `${current}% of ${prev} = ${result}`;

      // Không thay đổi previousOperand, giữ nguyên để tiếp tục phép tính
      // Ví dụ: 50 + 10% → currentOperand = 5, vẫn giữ operation = "+"
    } else {
      // Không có phép tính trước đó, chỉ đơn giản chia 100
      result = this.roundResult(current / 100);

      // Chain percent(percent(...)) - chỉ khi previousOperand kết thúc bằng "="
      let prevExpr = this.currentOperand;
      if (this.previousOperand && this.previousOperand.endsWith("=")) {
        prevExpr = this.previousOperand.slice(0, -1).trim();
      }

      this.previousOperand = `percent(${prevExpr}) =`;
      this.currentOperand = result.toString();
      historyStr = `percent(${prevExpr}) = ${result}`;
    }

    this.history.unshift(historyStr);
    if (this.history.length > 10) this.history.pop();
    if (this.historyPanel && this.historyPanel.style.display === "block") {
      this.updateHistoryDisplay();
    }
    this.justEvaluated = true;
  }

  sqrt() {
    const current = parseFloat(this.currentOperand);
    if (current < 0) {
      const historyStr = `√(${current}) = Invalid input`;
      this.currentOperand = "Invalid input";
      this.previousOperand = "";
      this.operation = undefined;
      this.justEvaluated = true;
      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
      if (this.historyPanel && this.historyPanel.style.display === "block") {
        this.updateHistoryDisplay();
      }
      return;
    }
    const result = this.roundResult(Math.sqrt(current));

    // Xác định biểu thức để hiển thị
    let displayExpr;
    let historyStr;

    // Nếu đang ở giữa phép tính (có operation và previousOperand không kết thúc bằng "=")
    if (
      this.operation &&
      this.previousOperand &&
      !this.previousOperand.endsWith("=")
    ) {
      // Tính kết quả của √ trước
      historyStr = `√(${this.currentOperand}) = ${result}`;

      // Sau đó tự động thực hiện phép tính với previousValue
      const prev =
        this.previousValue !== null
          ? this.previousValue
          : parseFloat(this.previousOperand);
      let finalResult;
      switch (this.operation) {
        case "+":
          finalResult = this.roundResult(prev + result);
          break;
        case "-":
          finalResult = this.roundResult(prev - result);
          break;
        case "×":
          finalResult = this.roundResult(prev * result);
          break;
        case "÷":
          finalResult = this.roundResult(prev / result);
          break;
        default:
          finalResult = result;
      }

      // Hiển thị: previousOperand operation √(currentOperand)
      const fullExpression = `${this.previousOperand} ${this.operation} √(${this.currentOperand})`;
      this.previousOperand = fullExpression;
      this.currentOperand = finalResult.toString();

      // Thêm kết quả cuối cùng vào lịch sử
      const finalHistoryStr = `${fullExpression} = ${finalResult}`;
      this.history.unshift(finalHistoryStr);
      if (this.history.length > 10) this.history.pop();

      this.operation = undefined;
      this.previousValue = null;
    } else if (this.previousOperand && this.previousOperand.endsWith("=")) {
      // Chain √(√(...))
      const prevExpr = this.previousOperand.slice(0, -1).trim();
      displayExpr = `√(${prevExpr}) =`;
      historyStr = `√(${prevExpr}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    } else {
      // Trường hợp đơn giản: chỉ √(x)
      displayExpr = `√(${this.currentOperand}) =`;
      historyStr = `√(${this.currentOperand}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    }

    if (this.historyPanel && this.historyPanel.style.display === "block") {
      this.updateHistoryDisplay();
    }
    this.operation = undefined;
    this.justEvaluated = true;
  }

  reciprocal() {
    const current = parseFloat(this.currentOperand);
    if (current === 0) {
      const historyStr = `1/(0) = Cannot divide by zero`;
      this.currentOperand = "Cannot divide by zero";
      this.previousOperand = "";
      this.operation = undefined;
      this.justEvaluated = true;
      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
      if (this.historyPanel && this.historyPanel.style.display === "block") {
        this.updateHistoryDisplay();
      }
      return;
    }
    const result = this.roundResult(1 / current);

    // Xác định biểu thức để hiển thị
    let displayExpr;
    let historyStr;

    // Nếu đang ở giữa phép tính (có operation và previousOperand không kết thúc bằng "=")
    if (
      this.operation &&
      this.previousOperand &&
      !this.previousOperand.endsWith("=")
    ) {
      // Tính kết quả của 1/x trước
      historyStr = `1/(${this.currentOperand}) = ${result}`;

      // Sau đó tự động thực hiện phép tính với previousValue
      const prev =
        this.previousValue !== null
          ? this.previousValue
          : parseFloat(this.previousOperand);
      let finalResult;
      switch (this.operation) {
        case "+":
          finalResult = this.roundResult(prev + result);
          break;
        case "-":
          finalResult = this.roundResult(prev - result);
          break;
        case "×":
          finalResult = this.roundResult(prev * result);
          break;
        case "÷":
          finalResult = this.roundResult(prev / result);
          break;
        default:
          finalResult = result;
      }

      // Hiển thị: previousOperand operation 1/(currentOperand)
      const fullExpression = `${this.previousOperand} ${this.operation} 1/(${this.currentOperand})`;
      this.previousOperand = fullExpression;
      this.currentOperand = finalResult.toString();

      // Thêm kết quả cuối cùng vào lịch sử
      const finalHistoryStr = `${fullExpression} = ${finalResult}`;
      this.history.unshift(finalHistoryStr);
      if (this.history.length > 10) this.history.pop();

      this.operation = undefined;
      this.previousValue = null;
    } else if (this.previousOperand && this.previousOperand.endsWith("=")) {
      // Chain 1/(1/(...))
      const prevExpr = this.previousOperand.slice(0, -1).trim();
      displayExpr = `1/(${prevExpr}) =`;
      historyStr = `1/(${prevExpr}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    } else {
      // Trường hợp đơn giản: chỉ 1/(x)
      displayExpr = `1/(${this.currentOperand}) =`;
      historyStr = `1/(${this.currentOperand}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    }

    if (this.historyPanel && this.historyPanel.style.display === "block") {
      this.updateHistoryDisplay();
    }
    this.operation = undefined;
    this.justEvaluated = true;
  }

  square() {
    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;
    const result = this.roundResult(current * current);

    // Xác định biểu thức để hiển thị
    let displayExpr;
    let historyStr;

    // Nếu đang ở giữa phép tính (có operation và previousOperand không kết thúc bằng "=")
    if (
      this.operation &&
      this.previousOperand &&
      !this.previousOperand.endsWith("=")
    ) {
      // Tính kết quả của sqr trước
      historyStr = `sqr(${this.currentOperand}) = ${result}`;

      // Sau đó tự động thực hiện phép tính với previousValue
      const prev =
        this.previousValue !== null
          ? this.previousValue
          : parseFloat(this.previousOperand);
      let finalResult;
      switch (this.operation) {
        case "+":
          finalResult = this.roundResult(prev + result);
          break;
        case "-":
          finalResult = this.roundResult(prev - result);
          break;
        case "×":
          finalResult = this.roundResult(prev * result);
          break;
        case "÷":
          finalResult = this.roundResult(prev / result);
          break;
        default:
          finalResult = result;
      }

      // Hiển thị: previousOperand operation sqr(currentOperand)
      const fullExpression = `${this.previousOperand} ${this.operation} sqr(${this.currentOperand})`;
      this.previousOperand = fullExpression;
      this.currentOperand = finalResult.toString();

      // Thêm kết quả cuối cùng vào lịch sử
      const finalHistoryStr = `${fullExpression} = ${finalResult}`;
      this.history.unshift(finalHistoryStr);
      if (this.history.length > 10) this.history.pop();

      this.operation = undefined;
      this.previousValue = null;
    } else if (this.previousOperand && this.previousOperand.endsWith("=")) {
      // Chain sqr(sqr(...))
      const prevExpr = this.previousOperand.slice(0, -1).trim();
      displayExpr = `sqr(${prevExpr}) =`;
      historyStr = `sqr(${prevExpr}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    } else {
      // Trường hợp đơn giản: chỉ sqr(x)
      displayExpr = `sqr(${this.currentOperand}) =`;
      historyStr = `sqr(${this.currentOperand}) = ${result}`;
      this.previousOperand = displayExpr;
      this.currentOperand = result.toString();

      this.history.unshift(historyStr);
      if (this.history.length > 10) this.history.pop();
    }

    if (this.historyPanel && this.historyPanel.style.display === "block") {
      this.updateHistoryDisplay();
    }
    this.operation = undefined;
    this.justEvaluated = true;
  }

  negate() {
    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;
    this.currentOperand = (-current).toString();
  }

  setupKeyboardSupport() {
    document.addEventListener("keydown", (e) => {
      if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
        e.preventDefault();
        if (this.justEvaluated) {
          this.currentOperand = e.key === "." ? "0." : e.key;
          this.justEvaluated = false;
        } else {
          this.appendNumber(e.key);
        }
        this.updateDisplay();
      } else if (
        e.key === "+" ||
        e.key === "-" ||
        e.key === "*" ||
        e.key === "/"
      ) {
        e.preventDefault();
        const operationMap = {
          "+": "+",
          "-": "-",
          "*": "×",
          "/": "÷",
        };
        this.chooseOperation(operationMap[e.key]);
        this.updateDisplay();
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        this.compute();
        this.updateDisplay();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        this.delete();
        this.updateDisplay();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.clearAll();
        this.updateDisplay();
      }
    });
  }

  updateDisplay() {
    this.displayElement.innerText = this.currentOperand;
    if (this.operation != null) {
      this.previousOperandElement.innerText = `${this.previousOperand} ${this.operation}`;
    } else {
      this.previousOperandElement.innerText = this.previousOperand;
    }
  }
}

// Initialize calculator when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new Calculator();
});
