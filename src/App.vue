<script>
  /*
  * Specification of item data structure:
  * {
  *  type: string, // 'text', 'radio', 'checkbox', 'scale'
  *  title: string,
  *  optTexts: string[], // only for 'radio', 'checkbox', 'scale'
  *  optValues: string[], // only for 'radio', 'checkbox', 'scale'
  *  required: boolean, // optional, whether the user must answer the question, default is true
  *  answer: string, // user's answer, appended after user submits
  *  refilled: boolean, // whether the user refilled the answer, appended after user submits
  * }
  */
  const ITEM_TYPES = ['text', 'radio', 'checkbox', 'scale'];
  function isValidItem({type, title, optTexts, optValues = null}) {
    if (!title || !ITEM_TYPES.includes(type)) {
      return false;
    }
    if (type === "text") {
      return true;
    }
    if (optTexts && optValues && optTexts.length !== optValues.length) {
      return false;
    }
    return true;
  }
  
  export default {
    data() {
      return {
        title: undefined,
        items: [],
        currentIdx: undefined,
        currentItem: undefined,
        currentAnswer: undefined,
        currentAnswerValue: undefined,
        currentRefilled: false,
        timestamp: undefined,
        settings: {
          allowBack: true,
        },
      }
    },
    created() {
      window.addEventListener('message', (event) => {
        const data = event.data;
        if (event.source === window.parent && data && data.type === 'iframe') {
          this.settings = Object.assign(this.settings, data.settings);
          this.items = structuredClone(data.items);
          this.title = data.title;
          if (!this.items.every(item => isValidItem(item))) {
            throw new Error('Invalid item');
          }
          
          this.currentIdx = 0;
          this.currentItem = this.items[this.currentIdx];
          this.timestamp = new Date().getTime();
        }
      });
    },
    computed: {
      isReady() {
        return this.items && this.title;
      },
      displayTitle() {
        return `${this.currentIdx + 1}. ${this.items[this.currentIdx].title}`;
      },
      nextButtonText() {
        return this.currentIdx === this.items.length - 1 ? 'Submit' : 'Next';
      },
      nextButtonStatus() {
        return this.currentIdx === this.items.length - 1 ? 'submit' : '';
      },
      backButtonStatus() {
        return this.currentIdx === 0 ? 'disabled' : '';
      }
    },
    methods: {
      clickNext() {
        const item = this.items[this.currentIdx];
        item.answer = this.currentAnswer;
        item.refilled = this.currentRefilled;
        item.responseTime = new Date().getTime() - this.timestamp;

        if (this.currentIdx === this.items.length - 1) {
          this.submit();
        } else {
          this.currentIdx++;
          this.currentAnswer = null;
          this.currentItem = this.items[this.currentIdx];
          this.currentRefilled = (this.currentItem.answer !== undefined);
          this.timestamp = new Date().getTime();
        }
      },
      clickBack() {
        if (this.currentIdx > 0) {
          this.currentIdx--;
          this.currentAnswer = this.items[this.currentIdx].answer;
          this.currentItem = this.items[this.currentIdx];
          this.currentRefilled = (this.currentItem.answer !== undefined);
          this.timestamp = new Date().getTime();
        }
      },
      submit() {
        const results = this.items.map((item, index) => ({
          index: index,
          title: item.title,
          answer: item.answer,
          refilled: item.refilled,
          responseTime: item.responseTime,
        }));
        const elem = document.createElement('a');
        elem.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results));
        elem.download = 'results.json';
        elem.click();
      }
    }
  }
</script>

<template>
  <div class="container" v-if="isReady">
    <span class="display-title">{{ displayTitle }}</span>
    <template v-if="currentItem.type === 'text'">
      <div class="item text">
        <input type="text" v-model="currentAnswer">
      </div>
    </template>
    <template v-else-if="currentItem.type === 'radio'">
      <div class="item radio" v-for="(optText, index) in currentItem.optTexts" :key="index">
        <input type="radio" :id="index" :value="currentItem.optValues[index]" v-model="currentAnswer">
        <label :for="index">{{ optText }}</label>
      </div>
    </template>
    
    <button
      v-if="settings.allowBack"
      @click="clickBack"
      :class="backButtonStatus">Back</button>
    <button @click="clickNext" :class="nextButtonStatus">{{ nextButtonText }}</button>
  </div>
</template>

<style scoped>
  .container {
    text-align: left;
    width: 100%;
  }
  button {
    background-color: #008CBA;
    border: none;
    color: white;
    padding: 10px 20px;
    text-align: center;
    text-decoration: none;
    border-radius: 5px;
    display: inline-block;
    font-size: 18px;
    margin-right: 20px;
  }
  button.submit {
    background-color: #4CAF50;
  }
  button.disabled {
    background-color: #cccccc;
  }
  input[type=text] {
    width: 100%;
    padding: 12px 18px;
    margin: 8px 20px 20px 0px;
    display: inline-block;
    box-sizing: border-box;
    border: 2px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
  input[type=radio] {
    margin-bottom: 4px;
    margin-right: 10px;
    text-align: left;
  }
  label {
    font-size: 16px;
  }
  .item {
    margin-bottom: 20px;
    width: 100%;
  }
  .display-title {
    font-size: 20px;
    font-weight: bold;
  }
</style>