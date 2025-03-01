<script>
  // import Item from './item.js';
  function isValid({type, title, optTexts, optValues = null}) {
    if (!title || !["text", "radio", "checkbox", "scale"].includes(type)) {
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
        currentAnswer: undefined
      }
    },
    created() {
      window.addEventListener('message', (event) => {
        const data = event.data;
        if (event.source === window.parent && data && data.type === 'iframe') {
          this.items = data.items;
          this.title = data.title;
          this.currentIdx = 0;
          if (!this.items.every(item => isValid(item))) {
            throw new Error('Invalid item');
          }
        }
      });
    },
    methods: {
      getDisplayTitle() {
        return `${this.currentIdx + 1}. ${this.items[this.currentIdx].title}`;
      },
      clickNext() {
        if (this.items[this.currentIdx].type === 'text') {
          this.items[this.currentIdx].answer = this.currentAnswer;
        }
        this.currentIdx = (this.currentIdx + 1) % this.items.length;
        if (this.items[this.currentIdx].answer) {
          this.currentAnswer = this.items[this.currentIdx].answer;
        } else {
          this.currentAnswer = '';
        }
      },
      isReady() {
        return this.items && this.title;
      }
    }
  }
</script>

<template>
  <div v-if="isReady()">
    <template v-if="items[currentIdx].type === 'text'">
      <span class="itemTitle">{{ getDisplayTitle() }}</span>
      <input type="text" v-model="currentAnswer">
    </template>
    <button @click="clickNext">Next</button>
  </div>
</template>

<style scoped>
  button {
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 15px 15px;
    text-align: center;
    text-decoration: none;
    border-radius: 4px;
    display: inline-block;
    font-size: 16px;
  }
  input[type=text] {
    width: 100%;
    padding: 12px 20px;
    margin: 8px 20px 20px 0px;
    display: inline-block;
    box-sizing: border-box;
  }
  .itemTitle {
    font-size: 20px;
    font-weight: bold;
  }
</style>