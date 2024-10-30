Editor.Panel.extend({
  // Định nghĩa các thuộc tính của panel
  style: `
    #panel-container {
      padding: 10px;
      background-color: #fff;
    }
  `,

  template: `
    <div id="panel-container">
      <h1>Hello, Cocos Creator!</h1>
      <button id="my-button">Click Me</button>
    </div>
  `,

  // Khi panel được mở
  ready() {
    this.$button = this.shadowRoot.querySelector('#my-button');
    this.$button.addEventListener('click', () => {
      Editor.log('Button clicked!');
    });
  },

  // Khi panel bị đóng
  close() {
    this.$button.removeEventListener('click');
  },
});
