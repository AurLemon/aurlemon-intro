<template>
	<div class="aurle-home-intro">
		<div class="aurle-home-me">
			<div class="aurle-home-me__name">
				<div class="aurle-home-me__info" translate="no">
					<div class="aurle-home-me__username">AurLemon</div>
					<div class="aurle-home-me__id">@AurLemon</div>
				</div>
				<div class="aurle-home-me__nick">
					<div class="nick">柠檬</div>
					<div class="simply-tag">
						{{ dayjs().diff(dayjs(birthdate), 'year') }}
					</div>
					<div class="simply-tag">
						{{
							dayjs().isAfter(dayjs(atbeeExamDate)) ? '臭二本的' : '臭大专的'
						}}
					</div>
					<div class="simply-tag">INFP/FJ/TJ</div>
					<div class="simply-tag">6w7</div>
					<div class="simply-tag">福州</div>
				</div>
				<div class="aurle-home-me__button">
					<div class="aurle-home-me__contact">
						<div class="aurle-home-me__item">
							<a
								href="https://github.com/AurLemon"
								target="_blank"
								rel="noopener noreferrer"
							>
								<GitHubIcon />
							</a>
						</div>
						<div class="aurle-home-me__item">
							<a
								href="https://space.bilibili.com/204271518"
								target="_blank"
								rel="noopener noreferrer"
							>
								<BilibiliIcon />
							</a>
						</div>
						<div class="aurle-home-me__item">
							<a
								href="https://music.163.com/#/user/home?id=418382005"
								target="_blank"
								rel="noopener noreferrer"
							>
								<NCMIcon />
							</a>
						</div>
						<div class="aurle-home-me__item">
							<a
								href="https://afdian.com/a/HydCraft"
								target="_blank"
								rel="noopener noreferrer"
							>
								<img src="../../assets/images/homepage/icons/Afdian.png" />
							</a>
						</div>
						<div class="aurle-home-me__item">
							<a
								href="mailto:2115386831@qq.com"
								target="_blank"
								rel="noopener noreferrer"
							>
								<MailIcon />
							</a>
						</div>
					</div>
				</div>
			</div>
			<UTooltip text="喜欢我吗？">
				<div class="aurle-home-me__avatar">
					<img src="~/assets/images/AurLemon_Avatar.jpg" />
				</div>
			</UTooltip>
		</div>
		<div class="aurle-home-quote">
			<div class="aurle-home-quote__text">做个好的螺丝钉就行 :)</div>
		</div>
	</div>
</template>

<script setup lang="ts">

import dayjs from 'dayjs'
import { birthdate, atbeeExamDate } from '../../utils/time'

import GitHubIcon from '~/assets/images/homepage/icons/GitHub.svg'
import MailIcon from '~/assets/images/homepage/icons/Mail.svg'
import BilibiliIcon from '~/assets/images/homepage/icons/bilibili.svg'
import NCMIcon from '~/assets/images/homepage/icons/NCMusic.svg'
</script>

