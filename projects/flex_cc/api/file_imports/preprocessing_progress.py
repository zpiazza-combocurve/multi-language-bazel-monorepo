from combocurve.shared.progress_notifier import ProgressNotifier


class FileImportPreprocessingProgress(ProgressNotifier):
    def get_batches_notifier(self, base_progress, part_from_total, header_reader, monthly_reader, daily_reader,
                             survey_reader):
        def batches_notifier(headers_progress=0):
            headers_weight = header_reader.file_size if header_reader else 0
            (monthly_progress, monthly_weight) = (monthly_reader.get_progress(),
                                                  monthly_reader.file_size) if monthly_reader else (0, 0)
            (daily_progress, daily_weight) = (daily_reader.get_progress(),
                                              daily_reader.file_size) if daily_reader else (0, 0)
            (survey_progress, survey_weight) = (survey_reader.get_progress(),
                                                survey_reader.file_size) if survey_reader else (0, 0)
            total_weight = headers_weight + monthly_weight + daily_weight + survey_weight
            batches_progress = (headers_progress * headers_weight + monthly_progress * monthly_weight
                                + daily_progress * daily_weight + survey_progress * survey_weight) / total_weight
            self.notify(base_progress + batches_progress * part_from_total)

        return batches_notifier
