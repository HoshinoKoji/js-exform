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
        currentTitle: undefined,
        currentIdx: undefined,
        currentItem: undefined,
        currentAnswer: undefined,
        currentAnswerValue: undefined,
        currentRefilled: false,
        timestamp: undefined,
        uiStatus: {
          backButtonDisabled: true,
          nextButtonText: 'Next',
          nextButtonStatus: 'primary',
        },
        settings: {
          allowBack: true,
        },
      }
    },
    created() {
      window.addEventListener('message', (event) => {
        const data = event.data;
        if (event.source === window.parent && data && data.type === 'spec') {
          this.settings = Object.assign(this.settings, data.settings);
          this.items = structuredClone(data.items);
          this.title = data.title;
          if (!this.items.every(item => isValidItem(item))) {
            throw new Error('Invalid item');
          }
          
          this.currentIdx = 0;
          this.updateItem();
        }
      });
    },
    computed: {
      isReady() {
        return this.items && this.title;
      },
    },
    methods: {
      updateBackButton() {
        this.uiStatus.backButtonDisabled = !this.settings.allowBack || (this.currentIdx === 0);
      },
      updateNextButton() {
        if (this.currentIdx === this.items.length - 1) {
          this.uiStatus.nextButtonText = 'Submit';
          this.uiStatus.nextButtonStatus = 'success';
        } else {
          this.uiStatus.nextButtonText = 'Next';
          this.uiStatus.nextButtonStatus = 'primary';
        }
      },
      updateTitle() {
        this.currentTitle = this.currentItem ?
          `${this.currentIdx + 1}. ${this.currentItem.title}` : '';
      },
      updateItem() {
        this.currentItem = this.items[this.currentIdx];
        this.currentAnswer = this.items[this.currentIdx].answer;
        this.currentRefilled = (this.currentItem.answer !== undefined);
        this.timestamp = new Date().getTime();
        this.updateTitle();
        this.updateBackButton();
        this.updateNextButton();
      },
      iterOptions() {
        return this.currentItem.optTexts.map((optText, index) => [
          optText,
          this.currentItem.optValues ? this.currentItem.optValues[index] : optText,
        ]);
      },
      clickNext() {
        const item = this.items[this.currentIdx];
        item.answer = this.currentAnswer;
        item.refilled = this.currentRefilled;
        item.responseTime = new Date().getTime() - this.timestamp;

        if (this.currentIdx === this.items.length - 1) {
          this.submit();
        } else {
          this.currentIdx++;
          this.updateItem();
        }
      },
      autoNext() {
        if (this.currentIdx < this.items.length - 1) {
          this.clickNext();
        }
      },
      clickBack() {
        if (this.currentIdx > 0) {
          this.currentIdx--;
          this.updateItem();
        }
      },
      submit() {
        const results = this.items.map((item, index) => ({
          index: index,
          title: item.title,
          answer: item.answer || '',
          refilled: item.refilled,
          responseTime: item.responseTime,
        }));
        window.parent.postMessage({ type: 'response', results }, window.origin);
        const elem = document.createElement('a');
        elem.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results));
        elem.download = 'results.json';
        elem.click();
      }
    }
  }
</script>

<template>
  <div v-if="!isReady">Loading...</div>
  <div id="container" v-if="isReady">
    <span id="display-title">{{ currentTitle }}</span>
    <div id="display-content">
      <template v-if="currentItem.type === 'text'">
        <el-input v-model="currentAnswer" style="width: 240px" placeholder="Please input" />
      </template>
      <template v-else-if="currentItem.type === 'radio'">
        <div>
          <el-radio-group
            v-model="currentAnswer"
            v-for="[optText, optValue] in iterOptions()"
            :key="optValue"
            @change="autoNext"
          >
            <el-radio-button :label="optText" :value="optValue" />
          </el-radio-group>
        </div>
      </template>
    </div>
    <div id="display-buttons">
      <el-button-group>
        <el-button type="primary" round :disabled="uiStatus.backButtonDisabled" @click="clickBack">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>Back
        </el-button>
        <el-button :type="uiStatus.nextButtonStatus" round @click="clickNext">
          {{ uiStatus.nextButtonText }}<el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<style scoped>
  #container {
    text-align: left;
    width: 100%;
  }
  #display-title {
    font-size: 20px;
    font-weight: bold;
  }
  #display-content {
    margin-top: 1ex;
    margin-bottom: 2ex;
  }
  #display-buttons {
    text-align: center;
  }
</style>