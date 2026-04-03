<template>
	<footer class="aurle-page-footer">
		<div class="aurle-page-footer__wrapper">
			<div class="aurle-page-footer__link">
				<div class="aurle-page-footer__menu">
					<div class="aurle-page-footer__title">周边网站</div>
					<div class="aurle-page-footer__item">
						<div class="aurle-page-footer__target">
							<a
								href="https://cnblogs.com/AurLemon"
								target="_blank"
								rel="noopener noreferrer"
								>博客</a
							>
						</div>
						<div class="aurle-page-footer__target">
							<a
								href="https://github.com/AurLemon"
								target="_blank"
								rel="noopener noreferrer"
								>GitHub</a
							>
						</div>
						<div class="aurle-page-footer__target">
							<a
								href="https://plan.aurlemon.top"
								target="_blank"
								rel="noopener noreferrer"
								>计划表</a
							>
						</div>
						<div class="aurle-page-footer__target">
							<a
								href="https://wiki.aurlemon.top"
								target="_blank"
								rel="noopener noreferrer"
								>知识库</a
							>
						</div>
					</div>
				</div>
				<div class="aurle-page-footer__menu">
					<div class="aurle-page-footer__title">建设</div>
					<div class="aurle-page-footer__item">
						<div class="aurle-page-footer__target">
							<span>友链</span>
						</div>
						<div class="aurle-page-footer__target">
							<span>关于本站</span>
						</div>
					</div>
				</div>
				<div class="aurle-page-footer__menu">
					<div class="aurle-page-footer__title">相关业务</div>
					<div class="aurle-page-footer__item">
						<div class="aurle-page-footer__target">
							<a
								href="https://wiki.hydcraft.cn"
								target="_blank"
								rel="noopener noreferrer"
								>氢气工艺维基站</a
							>
						</div>
					</div>
				</div>
			</div>
			<div class="aurle-page-footer__info">
				<div class="aurle-page-footer__register">
					<a href="https://beian.miit.gov.cn">
						{{ miitRegisterCode }}
					</a>
				</div>
				<div class="aurle-page-footer__list">
					<div class="aurle-page-footer__info aurle-page-footer__copyright">
						© AurLemon 2006 - {{ dayjs().year() }} All Rights Reserved
					</div>
					<div class="aurle-page-footer__info aurle-page-footer__license">
						CC BY-NC-SA 4.0
					</div>
					<div class="aurle-page-footer__info aurle-page-footer__onlinetime">
						已运行<span class="time">{{ getSiteRunningDays() }}</span
						>天
					</div>
					<div class="aurle-page-footer__info aurle-page-footer__contact">
						欢迎同好来交流和扩列🤝👍
					</div>
				</div>
			</div>
		</div>
	</footer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

const miitRegisterCode = ref<string>('闽ICP备2023007345号-3')
const siteBuildTime = dayjs('2024-11-6')

const getSiteRunningDays = (): number => {
	return dayjs().diff(siteBuildTime, 'day')
}
</script>
