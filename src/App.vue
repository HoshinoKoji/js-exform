<script>
import { ElMessage } from 'element-plus';
import { isProxy } from 'vue';
import { sprintf } from 'sprintf-js';
import lang from './lang.js';

const ITEM_TYPES = ['text', 'radio', 'checkbox', 'scale', 'display'];
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
      showPanel: true,
      currentIdx: undefined,
      itemStatus: {
        item: undefined,
        timestamp: undefined,
        title: undefined,
        answer: undefined,
        refilled: false,
      },
      uiStatus: {
        backButtonDisabled: true,
        nextButtonText: lang['en-US'].next,
        nextButtonStatus: 'primary',
      },
      settings: {
        allowBack: true,
        allowAutoNext: true,
        darkMode: false,
        showItemIndex: true,
        origin: '*',
        lang: 'en-US',
      },
      lang,
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

        if (this.settings.darkMode) {
          document.documentElement.classList.add('dark');
        }

        this.currentIdx = 0;
        this.updateItem();
        this.started = new Date().getTime();
      }
    });
  },
  computed: {
    isReady() {
      return this.items && this.items.length > 0;
    },
  },
  methods: {
    updateBackButton() {
      const itemAllowBack = this.items[this.currentIdx].allowBack === undefined ?
        this.settings.allowBack : this.items[this.currentIdx].allowBack;
      this.uiStatus.backButtonDisabled = !itemAllowBack || (this.currentIdx === 0);
    },
    updateNextButton() {
      if (this.currentIdx === this.items.length - 1) {
        this.uiStatus.nextButtonText = lang[this.settings.lang].submit;
        this.uiStatus.nextButtonStatus = 'success';
      } else {
        this.uiStatus.nextButtonText = lang[this.settings.lang].next;
        this.uiStatus.nextButtonStatus = 'primary';
      }
    },
    updateTitle() {
      const prefix = this.settings.showItemIndex ? `${this.currentIdx + 1}. ` : '';
      this.itemStatus.title = this.itemStatus.item ? `${prefix}${this.itemStatus.item.title}` : '';
    },
    updateItem() {
      this.itemStatus.item = this.items[this.currentIdx];
      this.itemStatus.answer = this.items[this.currentIdx].answer;
      this.itemStatus.refilled = (this.itemStatus.answer !== undefined);
      this.itemStatus.timestamp = new Date().getTime();
      this.updateTitle();
      this.updateBackButton();
      this.updateNextButton();
    },
    iterOptions() {
      return this.itemStatus.item.optTexts.map((optText, index) => [index, optText]);
    },
    getScaleMarks() {
      const marks = {};
      this.itemStatus.item.optTexts.forEach((optText, index) => {
        marks[index] = (index === 0 || index === this.itemStatus.item.optTexts.length - 1) ? optText : '';
      });
      return marks;
    },
    clickNext() {
      const item = this.items[this.currentIdx];
      if (item.type !== 'display' && item.type !== 'checkbox' && item.required && this.itemStatus.answer === undefined) {
        ElMessage({
          message: lang[this.settings.lang].required,
          type: 'error',
        });
        return;
      } else if (item.type === 'checkbox' && item.required) {
        this.itemStatus.answer = this.itemStatus.answer === undefined ? [] : this.itemStatus.answer;
        const { minOpts, maxOpts } = Object.assign({ minOpts: 1, maxOpts: item.optTexts.length }, item);
        if (this.itemStatus.answer.length < minOpts || this.itemStatus.answer.length > maxOpts) {
          ElMessage({
            message: sprintf(lang[this.settings.lang].checkboxOutOfRange, minOpts, maxOpts),
            type: 'error',
          });
          return;
        }
      }

      this.showPanel = false;
      item.answer = this.itemStatus.answer;
      item.refilled = this.itemStatus.refilled;
      item.responseTime = new Date().getTime() - this.itemStatus.timestamp;
      if (item.type === 'radio' && item.answer !== undefined) {
        item.answerText = item.optTexts[item.answer];
        item.answerValue = item.optValues[item.answer];
      } else if (item.type === 'checkbox') {
        item.answerText = item.answer ? item.answer.map(idx => item.optTexts[idx]).join(', ') : null;
        item.answerValue = item.answer ? item.answer.map(idx => item.optValues[idx]).join(', ') : null;
      } if (item.type === 'scale' && item.answer !== undefined) {
        item.answerText = item.optTexts[item.answer];
        item.answerValue = item.optValues[item.answer];
      }

      if (this.currentIdx === this.items.length - 1) {
        this.submit();
      } else {
        setTimeout(() => {
          this.currentIdx++;
          this.updateItem();
          this.showPanel = true;
        }, 300);
      }
    },
    autoNext() {
      if (this.settings.allowAutoNext && this.currentIdx < this.items.length - 1 && !this.itemStatus.refilled) {
        this.clickNext();
      }
    },
    clickBack() {
      if (this.currentIdx > 0) {
        this.currentIdx--;
        this.updateItem();
      }
    },
    transformAnswer(answer) {
      return isProxy(answer) ? [...answer]
        : (answer === undefined ? null : answer);
    },
    submit() {
      const results = this.items.map(item => ({
        title: item.title,
        key: item.key ? item.key : item.title,
        type: item.type,
        answer: this.transformAnswer(item.answer),
        answerText: this.transformAnswer(item.answerText),
        answerValue: this.transformAnswer(item.answerValue),
        refilled: item.refilled,
        responseTime: item.responseTime,
      }));
      window.parent.postMessage({
        type: 'response',
        started: this.started,
        ended: new Date().getTime(),
        results
      }, this.settings.origin);
    }
  }
}
</script>

<template>
  <div v-if="!isReady">Loading...</div>
  <transition name="el-fade-in">
    <el-container id="main" direction="vertical" v-if="isReady" v-show="showPanel">
      <div style="padding-left: 12pt;">
        <el-text class="mx-1" type="primary"><span id="display-title">{{ itemStatus.title }}</span></el-text>
      </div>
      <el-main id="main-inner">
        <el-container id="display-desc" v-if="itemStatus.item.desc">
          <el-text class="mx-1" size="large"><span v-html="itemStatus.item.desc"></span></el-text>
        </el-container>

        <el-main id="display-content" :class="{ nodesc: !itemStatus.item.desc }">
          <template v-if="itemStatus.item.type === 'text'">
            <el-input v-model="itemStatus.answer" @keyup.enter="clickNext" autosize autofocus
              :placeholder="lang[settings.lang].input" />
          </template>
          <template v-else-if="itemStatus.item.type === 'radio'">
            <el-radio-group v-model="itemStatus.answer" @change="autoNext">
              <el-radio-button v-for="[index, optText] in iterOptions()" :key="index" :label="optText" :value="index" />
            </el-radio-group>
          </template>
          <template v-else-if="itemStatus.item.type === 'checkbox'">
            <el-checkbox-group v-model="itemStatus.answer">
              <el-checkbox-button v-for="[index, optText] in iterOptions()" :key="index" :label="optText"
                :value="index" />
            </el-checkbox-group>
          </template>
          <template v-else-if="itemStatus.item.type === 'scale'">
            <el-row id="scale-row">
              <el-col :span="4">
                <el-text size="large" tag="b">{{ itemStatus.item.optTexts[0] }}</el-text>
              </el-col>
              <el-col :span="16">
                <el-slider v-model="itemStatus.answer" size="small" show-stops :min="0"
                  :max="itemStatus.item.optTexts.length - 1" :format-tooltip="val => itemStatus.item.optTexts[val]"
                  @change="autoNext" />
              </el-col>
              <el-col :span="4">
                <el-text size="large" tag="b">{{ itemStatus.item.optTexts[itemStatus.item.optTexts.length - 1]
                  }}</el-text>
              </el-col>
            </el-row>
          </template>
        </el-main>

        <el-footer id="display-buttons">
          <el-button-group>
            <el-button type="info" round :disabled="uiStatus.backButtonDisabled" @click="clickBack">
              <el-icon class="el-icon--left">
                <ArrowLeft />
              </el-icon>{{ lang[settings.lang].back }}
            </el-button>
            <el-button :type="uiStatus.nextButtonStatus" round @click="clickNext">
              {{ uiStatus.nextButtonText }}<el-icon class="el-icon--right">
                <ArrowRight />
              </el-icon>
            </el-button>
          </el-button-group>
        </el-footer>
      </el-main>
    </el-container>
  </transition>
</template>

<style scoped>
#main {
  width: 50vw;
  max-height: 75vh;
  overflow: hidden;
  margin: 12vh auto;
  padding-top: 4ex;
  padding-left: 2ex;
  padding-right: 2ex;
  border-radius: var(--el-border-radius-round);
  box-shadow: var(--el-box-shadow-dark);
  font-family: var(--el-font-family);
}

#main-inner {
  margin-top: 0ex;
  padding-left: 16pt;
  scrollbar-width: none;
}

#display-title {
  text-align: left;
  font-size: 18pt;
  font-weight: bold;
}

#display-desc {
  width: 95%;
  margin: 0ex auto 0ex 2ex;
  padding-top: 0ex;
}

#display-buttons {
  text-align: center;
}

#display-content {
  margin-top: 2ex;
  padding-top: 0ex;
}

#display-content.nodesc {
  margin-top: 0ex;
}

#display-content el-input {
  width: 100%;
  font-size: 16pt;
}

#display-content #scale-row {
  text-align: center;
  vertical-align: middle;
}
</style>