window.onload = function () {
	// 创建一个新的样式元素
	const styleElement = document.createElement('style');
	// 设置样式内容
	styleElement.textContent = `
	.popup-container {
		overflow: auto;
    position: absolute;
		height: auto;
		font-size: 15px;
    display: none; /* 默认不显示，需要时改为 block */
    padding: 20px;
    background-color: #FFF9DB; /* 浮窗的背景颜色 */
    border-radius: 10px; /* 圆角 */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), /* 水平偏移 垂直偏移 模糊距离 颜色 */
                0 6px 20px rgba(0, 0, 0, 0.1); /* 内阴影 */
    z-index: 100000; /* 确保浮窗在其他元素上方 */
    /* 可以根据需要调整上、左位置 */

		* {
			user-select: text !important;
		}
}
`;
	// 将样式元素添加到文档的头部
	document.head.appendChild(styleElement);

	let __selectedText__ = '';

	function getContent() {
		__selectedText__ = window.getSelection().toString() || __selectedText__;
		iconContainer.style.display = 'none';
		dataElement.innerHTML = ''; // 清空之前的内容
		popupContainer.style.left = 0;
		popupContainer.style.top = window.scrollY + 'px';

		popupContainer.style.display = 'block';

		// 发送请求获取数据
		fetchData(__selectedText__);
	}

	// 创建一个弹窗容器
	const popupContainer = document.createElement('div');
	popupContainer.classList.add('popup-container');
	document.body.appendChild(popupContainer);

	// 创建一个用于显示图标的容器
	const iconContainer = document.createElement('div');
	iconContainer.style.position = 'absolute';
	iconContainer.style.zIndex = '10000000'; // 确保图标在最上层
	iconContainer.style.display = 'none';
	iconContainer.style.cursor = 'pointer';
	iconContainer.innerHTML =
		'<img src="' +
		chrome.runtime.getURL('./icons/logo.png') +
		'" width="20" height="20">'; // 获取扩展内的图标文件路径
	document.body.appendChild(iconContainer);

	// 创建关闭弹窗的按钮
	const closeButton = document.createElement('button');
	closeButton.textContent = '关闭';
	closeButton.onclick = function () {
		popupContainer.style.display = 'none';
		dataElement.textContent = '';
		popupContainer.style.height = 'auto';
	};
	popupContainer.appendChild(closeButton);

	// 创建关闭弹窗的按钮
	const scaleButton = document.createElement('button');
	scaleButton.textContent = '缩小';
	scaleButton.style.marginLeft = '15px';
	scaleButton.onclick = function () {
		popupContainer.style.height = '300px';
	};
	popupContainer.appendChild(scaleButton);

	const retryButton = document.createElement('button');
	retryButton.textContent = '重试';
	retryButton.style.marginLeft = '15px';
	retryButton.addEventListener('click', getContent);
	popupContainer.appendChild(retryButton);

	// 创建一个用于显示数据的元素
	const dataElement = document.createElement('div');
	popupContainer.appendChild(dataElement);

	// 当用户选中文本时显示图标
	document.addEventListener('mouseup', function (e) {
		const selection = window.getSelection();
		if (selection.toString().trim() !== '' && !dataElement.textContent) {
			// 获取选中文本的范围对象
			const range = selection.getRangeAt(0);
			// 获取选中范围每一行的矩形列表
			const rects = range.getClientRects();
			// 取最后一个矩形，即选中文本的最后一行
			const lastRect = rects[rects.length - 1];
			if (lastRect) {
				// 定位图标容器到最后一行的右边和顶部
				iconContainer.style.left = `${lastRect.right + window.scrollX + 35}px`;
				iconContainer.style.top = `${lastRect.top + window.scrollY + 35}px`;
				iconContainer.style.display = 'block';
			}
		} else {
			// 如果没有选中文本，则隐藏图标
			iconContainer.style.display = 'none';
		}
	});

	// 当用户点击其他地方时，隐藏图标
	document.addEventListener('mousedown', function (e) {
		if (e.target !== iconContainer && e.target.parentNode !== iconContainer) {
			iconContainer.style.display = 'none';
		}
	});

	window.addEventListener('scroll', e => {
		if (
			popupContainer &&
			popupContainer.style.display === 'block' &&
			e.target !== popupContainer
		) {
			popupContainer.style.top = window.scrollY + 'px';
		}
	});

	// 修改图标的点击事件
	iconContainer.addEventListener('click', getContent);

	const text =
		'请对提供的内容进行全面整理优化，具体任务包括：将内容分类并重新组织，使其条理分明、逻辑清晰；改进措辞，确保语言通俗易懂、自然流畅；检查和修正错误，保持内容的准确性；必要时补充相关知识，丰富内容的深度和广度；至少保留核心代码示例。请直接给出最终优化后的内容，原始内容：  ';

	// 定义获取数据的函数
	function fetchData(selectedText) {
		// 定义请求的参数
		const requestParams = {
			model: 'glm-4',
			messages: [
				{
					role: 'system',
					content: `回答请仔细遵循以下三项原则：
											1.担当与提问最相关的专家角色，提供实用详尽的回答。
											2.回答请符合标准文档格式规范，如中文与英文之间需要空格等。
											3.回答要通俗易懂，经过彻底的研究和反复的思考，提供准确可靠的信息。`,
				},
				{ role: 'user', content: text + selectedText },
			],
			// 其他可选参数...
		};

		fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization:
					'eyJhbGciOiJIUzI1NiIsInNpZ25fdHlwZSI6IlNJR04ifQ.eyJhcGlfa2V5IjoiNWVkYTdhYTQyYzZjOThkY2UwODIyOTBhMTE2ZjBmOWMiLCJleHAiOiIxNzEzNjYwNjUyMDU4IiwidGltZXN0YW1wIjoiMTcxMDA2MDUyMzgyNyJ9.WP_49lxwjN3fwCmd9EeH0YYVJbJ1vIOaW82eRF5Lzjc',
			},
			body: JSON.stringify(requestParams),
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok.');
				}

				// 获取 ReadableStream，并逐块读取
				const reader = response.body.getReader();

				// 递归函数来读取数据块
				function read() {
					reader
						.read()
						.then(({ done, value }) => {
							if (done) {
								return;
							}
							// 将 Uint8Array 转换为字符串并处理数据
							const chunk = new TextDecoder().decode(value);
							popupContainer.style.height = '600px';
							dataElement.innerHTML += marked.parse(
								JSON.parse(chunk).choices[0].message.content
							); // 追加新的内容到元素中
							read(); // 继续读取下一个数据块
						})
						.catch(error => {
							console.error('读取数据出错:', error);
							dataElement.textContent = '读取数据失败';
						});
				}

				read(); // 开始读取数据
			})
			.catch(error => {
				console.error('请求数据出错:', error);
				dataElement.textContent = '加载失败';
			});
	}
};
