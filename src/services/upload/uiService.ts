import { ProgressUpdater } from 'components/pages/gallery/Upload';

export const RANDOM_PERCENTAGE_PROGRESS_FOR_PUT = () => 90 + 10 * Math.random();

class UIService {
    private perFileProgress: number;
    private filesUploaded: number;
    private totalFileCount: number;
    private fileProgress: Map<string, number>;
    private uploadResult: Map<string, number>;
    private progressUpdater: ProgressUpdater;

    init(progressUpdater: ProgressUpdater) {
        this.progressUpdater = progressUpdater;
    }

    reset(count: number) {
        this.setTotalFileCount(count);
        this.filesUploaded = 0;
    }

    setTotalFileCount(count: number) {
        this.totalFileCount = count;
        this.perFileProgress = 100 / this.totalFileCount;
    }

    setFileProgress(filename: string, progress: number) {
        this.fileProgress.set(filename, progress);
        this.updateProgressBarUI();
    }

    setUploadStage(stage) {
        this.progressUpdater.setUploadStage(stage);
        this.updateProgressBarUI();
    }

    setPercentComplete(percent) {
        this.progressUpdater.setPercentComplete(percent);
        this.updateProgressBarUI();
    }

    increaseFileUploaded() {
        this.filesUploaded++;
        this.updateProgressBarUI();
    }

    moveFileToResultList(filename: string) {
        this.uploadResult.set(filename, this.fileProgress.get(filename));
        this.fileProgress.delete(filename);
        this.updateProgressBarUI();
    }

    updateProgressBarUI() {
        const {
            setPercentComplete,
            setFileCounter,
            setFileProgress,
            setUploadResult,
        } = this.progressUpdater;
        setFileCounter({
            finished: this.filesUploaded,
            total: this.totalFileCount,
        });
        let percentComplete = this.perFileProgress * this.filesUploaded;
        if (this.fileProgress) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, progress] of this.fileProgress) {
                // filter  negative indicator values during percentComplete calculation
                if (progress < 0) {
                    continue;
                }
                percentComplete += (this.perFileProgress * progress) / 100;
            }
        }
        setPercentComplete(percentComplete);
        setFileProgress(this.fileProgress);
        setUploadResult(this.uploadResult);
    }

    private trackUploadProgress(
        filename: string,
        percentPerPart = RANDOM_PERCENTAGE_PROGRESS_FOR_PUT(),
        index = 0,
    ) {
        const cancel = { exec: null };
        let timeout = null;
        const resetTimeout = () => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => cancel.exec(), 30 * 1000);
        };
        return {
            cancel,
            onUploadProgress: (event) => {
                filename &&
                    this.fileProgress.set(
                        filename,
                        Math.min(
                            Math.round(
                                percentPerPart * index +
                                    (percentPerPart * event.loaded) /
                                        event.total,
                            ),
                            98,
                        ),
                    );
                this.updateProgressBarUI();
                if (event.loaded === event.total) {
                    clearTimeout(timeout);
                } else {
                    resetTimeout();
                }
            },
        };
    }
}

export default new UIService();
