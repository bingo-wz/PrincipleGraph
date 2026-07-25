# ADR-0009：GitHub 作为主仓库，Sites 源仓库作为部署镜像

- 状态：Proposed
- 日期：2026-07-25

## 背景

Sites 已为 PrincipleGraph 创建私有项目和受管源仓库。项目同时需要长期代码托管、分支评审、Issue、CI 和未来多人协作，必须明确两个远端的职责，避免出现两个“主仓库”。

## 建议决策

- 用户自己的 GitHub 私有仓库作为唯一主仓库和协作事实源；
- Sites 受管源仓库作为第二个部署远端，只接收已经通过本地/CI 校验的明确 commit；
- 保存 Sites 版本时记录的 `commit_sha` 必须与推送到 Sites 的 HEAD 完全一致；
- `.openai/hosting.json` 只保存 Sites 项目标识与资源声明，不保存短期写入凭据；
- M0 可手工从同一 commit 推送两个远端，M1 再由 GitHub Actions 自动部署。

## 选择理由

- GitHub 提供长期可见的分支、Pull Request、Review、Issue、Actions、Release 和协作者权限；
- Sites 源仓库与版本、构建产物和生产部署的来源证明直接绑定；
- 双远端各自只承担一种职责，迁移托管平台时不会丢失主仓库；
- Sites 的短期凭据无需进入 GitHub Secrets 或本地配置文件。

## 备选

### 只使用 Sites 源仓库

优点：远端最少，创建原型和部署路径最短。

缺点：它的可调用能力围绕推送、保存版本和部署来源，不应假设具备 GitHub 的 PR、Issue、Actions、Release 或团队协作界面；也会把产品源码与单一部署平台耦合。

适用：一次性、单人、可随时丢弃的原型。

### 只使用 GitHub

优点：协作和长期维护能力完整，只有一个远端。

缺点：当前 Sites 保存版本要求源码先到它配置的源仓库，因此无法直接替代 Sites 的部署来源链。

适用：不使用 Sites 部署，或未来 Sites 支持直接连接 GitHub 时复审。

### GitHub 与 Sites 都作为主仓库

优点：任一远端都能看到完整代码。

缺点：分支保护、提交顺序和权限容易分叉，无法回答“哪边才是发布真相”。

结论：不采用。

## 异常与补偿

- Sites 写入凭据过期：重新获取短期凭据后重试同一 commit，不产生新 commit；
- GitHub 推送成功、Sites 推送失败：版本不得保存或部署；修复后补推同一 SHA；
- Sites 推送成功、版本保存失败：查询该项目版本状态，确认没有版本后用同一 SHA 重试；
- 两个远端 HEAD 不一致：阻断发布并输出 GitHub SHA、Sites SHA 和本地 SHA；
- GitHub 暂时不可用：已部署 Sites 版本不受影响，但禁止从未审查的本地提交创建新生产版本。

## 验收

- `origin` 指向用户自己的 GitHub，`sites` 指向 Sites 受管仓库；
- 任一生产版本都能追溯到 GitHub 中存在的同一 commit；
- 凭据扫描确认仓库内没有 Sites token；
- 失败演练覆盖“第二远端推送失败但未错误部署”。

## 复审触发

Sites 原生支持连接 GitHub 仓库，或团队决定迁移到其他生产托管平台时复审。
