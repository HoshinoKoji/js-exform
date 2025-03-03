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
function isValidItem({ type, title, optTexts, optValues = null }) {
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
      started: undefined,
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
        this.started = new Date().getTime();
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
        index,
        optText,
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
      window.parent.postMessage({
        type: 'response',
        started: this.started,
        ended: new Date().getTime(),
        results
      }, window.origin);
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
  <el-container id="main" v-if="isReady">
    <el-header height=22pt id="display-title">{{ currentTitle }}</el-header>
    <el-container id="display-desc" v-if="true">
      <el-text class="mx-1" size="large">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
        incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
        aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
        fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
        anim id est laborum.</el-text>
    </el-container>
    <el-main id="display-content">
      <template v-if="currentItem.type === 'text'">
        <el-input v-model="currentAnswer" autosize placeholder="Please input" />
      </template>
      <template v-else-if="currentItem.type === 'radio'">
        <el-radio-group v-model="currentAnswer" v-for="[index, optText] in iterOptions()" :key="index"
          @change="autoNext">
          <el-radio-button :label="optText" :value="index" />
        </el-radio-group>
      </template>
    </el-main>
    <el-footer id="display-buttons">
      <el-button-group>
        <el-button type="info" round :disabled="uiStatus.backButtonDisabled" @click="clickBack">
          <el-icon class="el-icon--left">
            <ArrowLeft />
          </el-icon>Back
        </el-button>
        <el-button :type="uiStatus.nextButtonStatus" round @click="clickNext">
          {{ uiStatus.nextButtonText }}<el-icon class="el-icon--right">
            <ArrowRight />
          </el-icon>
        </el-button>
      </el-button-group>
    </el-footer>
  </el-container>
</template>

<style scoped>
#main {
  width: 50%;
  background-color: #FAFCFF;
  margin: 10% 25%;
  padding-top: 4ex;
  padding-left: 2ex;
  padding-right: 2ex;
  border-radius: var(--el-border-radius-round);
  box-shadow: var(--el-box-shadow-dark);
  font-family: var(--el-font-family);
}

#display-title {
  text-align: left;
  font-size: 18pt;
  font-weight: bold;
  color: rgb(51.2, 126.4, 204);
}

#display-desc {
  width: 90%;
  margin: 1ex auto;
}

#display-buttons {
  text-align: center;
}

#display-content {
  padding-top: 1ex;
}

#display-content el-input {
  width: 100%;
  font-size: 16pt;
}
</style>